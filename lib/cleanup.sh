# Project DANILO installer module: cleanup.sh

backup_file() {
  local path="$1"
  local safe_path=""
  safe_path="${path#/}"
  safe_path="${safe_path//\//__}"

  mkdir -p "${BACKUP_ROOT}"
  if [[ -e "${BACKUP_ROOT}/${safe_path}.bak" || -e "${BACKUP_ROOT}/${safe_path}.missing" ]]; then
    return 0
  fi

  if [[ -e "${path}" || -L "${path}" ]]; then
    cp -a --remove-destination "${path}" "${BACKUP_ROOT}/${safe_path}.bak"
  else
    : > "${BACKUP_ROOT}/${safe_path}.missing"
  fi
}

backup_path_for() {
  local path="$1"
  local safe_path=""
  safe_path="${path#/}"
  safe_path="${safe_path//\//__}"
  printf '%s/%s.bak\n' "${BACKUP_ROOT}" "${safe_path}"
}

backup_managed_file() {
  backup_file "$1"
}

backup_managed_files() {
  local path=""
  for path in "${DANILO_MANAGED_FILES[@]}"; do
    backup_file "${path}"
  done
}

restore_file() {
  local path="$1"
  local safe_path=""
  safe_path="${path#/}"
  safe_path="${safe_path//\//__}"

  if [[ -e "${BACKUP_ROOT}/${safe_path}.bak" || -L "${BACKUP_ROOT}/${safe_path}.bak" ]]; then
    cp -a --remove-destination "${BACKUP_ROOT}/${safe_path}.bak" "${path}"
  elif [[ -e "${BACKUP_ROOT}/${safe_path}.missing" ]]; then
    rm -f "${path}"
  fi
}

resolver_file_has_upstream() {
  local path="$1"
  [[ -r "${path}" ]] || return 1
  awk '
    $1 == "nameserver" &&
    $2 != "127.0.0.53" &&
    $2 != "127.0.0.1" &&
    $2 != "::1" {
      found = 1
    }
    END { exit found ? 0 : 1 }
  ' "${path}"
}

rollback_install() {
  local path=""
  [[ "${INSTALL_SUCCEEDED}" -eq 1 ]] && return 0
  note "Attempting rollback of DANILO-owned system changes"
  systemctl stop danilo-stack.service danilo-ap.service >/dev/null 2>&1 || true
  if [[ -x /usr/local/bin/danilo-network-down.sh ]]; then
    /usr/local/bin/danilo-network-down.sh >/dev/null 2>&1 || true
  fi
  for path in "${DANILO_MANAGED_FILES[@]}"; do
    restore_file "${path}"
  done
  systemctl daemon-reload >/dev/null 2>&1 || true
  systemctl restart systemd-resolved >/dev/null 2>&1 || true
  systemctl restart NetworkManager >/dev/null 2>&1 || true
}

on_error() {
  local exit_code="${1:-$?}"
  local line_number="${2:-${BASH_LINENO[0]:-unknown}}"
  local failed_command="${3:-${BASH_COMMAND:-unknown}}"
  trap - ERR
  rollback_install
  print_failure "${exit_code}" "${line_number}" "${failed_command}"
}

trap 'on_error $? ${LINENO} "$BASH_COMMAND"' ERR

deep_clean() {
  note "Removing previous Project DANILO remnants"

  systemctl stop danilo-stack.service danilo-ap.service >/dev/null 2>&1 || true
  if [[ -f /etc/dnsmasq.d/danilo.conf || -f /etc/hostapd/danilo.conf ]]; then
    systemctl stop hostapd dnsmasq >/dev/null 2>&1 || true
  fi
  if [[ -x /usr/local/bin/danilo-network-down.sh ]]; then
    /usr/local/bin/danilo-network-down.sh >/dev/null 2>&1 || true
  fi

  backup_managed_files

  mkdir -p "${BACKUP_ROOT}"
  if [[ -f "${APP_ROOT}/.env" ]]; then
    install -m 0600 "${APP_ROOT}/.env" "${BACKUP_ROOT}/env.last"
  fi

  if command -v docker >/dev/null 2>&1; then
    docker rm -f "${TEMP_OLLAMA_CONTAINER}" >/dev/null 2>&1 || true
    if [[ -f "${APP_ROOT}/docker-compose.yml" ]]; then
      if [[ "${RESET_DATA}" == "1" ]]; then
        note "DANILO_RESET_DATA=1 set; removing DANILO containers and named volumes"
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" down -v --remove-orphans >/dev/null 2>&1 || true
      else
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" down --remove-orphans >/dev/null 2>&1 || true
      fi
    fi

    local containers=""
    containers="$(docker ps -aq --filter "label=com.docker.compose.project=${STACK_NAME}" 2>/dev/null || true)"
    if [[ -n "${containers}" ]]; then
      while IFS= read -r container_id; do
        [[ -z "${container_id}" ]] && continue
        docker rm -f "${container_id}" >/dev/null 2>&1 || true
      done <<< "${containers}"
    fi
  fi

  if [[ "${PROJECT_ROOT}" == /opt/danilo ]]; then
    note "Removing old application files, frontend builds, and generated cache under ${PROJECT_ROOT}"
    rm -rf "${PROJECT_ROOT}"
  else
    echo "Refusing to remove unexpected PROJECT_ROOT: ${PROJECT_ROOT}"
    exit 1
  fi
  rm -f /etc/dnsmasq.d/danilo.conf
  rm -f /etc/hostapd/danilo.conf
  rm -f /etc/systemd/system/danilo-ap.service
  rm -f /etc/systemd/system/danilo-stack.service
  rm -f /usr/local/bin/danilo-network-up.sh
  rm -f /usr/local/bin/danilo-network-down.sh
  rm -f /etc/sysctl.d/98-danilo-ipforward.conf
  rm -f /etc/systemd/resolved.conf.d/no-stub.conf
  rm -f /etc/NetworkManager/conf.d/99-danilo.conf
  find /etc/NetworkManager/system-connections -maxdepth 1 -type f -name 'danilo-*' -delete 2>/dev/null || true
  run_step_command "Reloading systemd after cleanup" systemctl daemon-reload
}

# Force systemd-resolved to release port 53 while keeping resolver behavior as
# close to the school's previous state as possible. Public resolvers are only a
# last resort when neither the prior config nor systemd's upstream file is usable.

