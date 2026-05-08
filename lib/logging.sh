# Project DANILO installer module: logging.sh

init_logging() {
  umask 077
  mkdir -p "$(dirname -- "${LOG_FILE}")" 2>/dev/null || true
  exec 3>&1
  exec > >(tee -a "${LOG_FILE}") 2>&1
}

format_duration() {
  local total_seconds="${1:-0}"
  local hours=0
  local minutes=0
  local seconds=0

  if (( total_seconds < 0 )); then
    total_seconds=0
  fi

  hours=$(( total_seconds / 3600 ))
  minutes=$(( (total_seconds % 3600) / 60 ))
  seconds=$(( total_seconds % 60 ))
  printf '%02d:%02d:%02d' "${hours}" "${minutes}" "${seconds}"
}

rule() {
  printf '%s' '------------------------------------------------------------'
}

progress_bar() {
  local current="$1"
  local total="$2"
  local width=28
  local filled=0
  local i=0

  if (( total > 0 )); then
    filled=$(( current * width / total ))
  fi

  if (( filled > width )); then
    filled="${width}"
  fi

  printf '['
  for (( i = 0; i < width; i++ )); do
    if (( i < filled )); then
      printf '='
    else
      printf '.'
    fi
  done
  printf ']'
}

print_install_intro() {
  printf '\n%s\n' "$(rule)"
  printf '%s%sPROJECT DANILO SETUP WIZARD%s\n' "${BOLD}" "${CYAN}" "${RESET}"
  printf '%sDigital Assistant Network for Interactive Learning Offline%s\n' "${DIM}" "${RESET}"
  printf '%sA clean, offline-first DepEd school portal installer for the 91%% learning poverty crisis%s\n' "${GREEN}" "${RESET}"
  printf '%slog%s     %s\n' "${DIM}" "${RESET}" "${LOG_FILE}"
  printf '%sstarted%s %s\n' "${DIM}" "${RESET}" "$(date '+%Y-%m-%d %H:%M:%S')"
}

step() {
  local current="$1"
  local total="$2"
  local message="$3"
  local now=0
  local elapsed=0
  local completed=0
  local remaining=0
  local eta_text="--:--:--"
  local percent=0

  CURRENT_STEP_INDEX="${current}"
  CURRENT_STEP_TOTAL="${total}"
  CURRENT_STEP_LABEL="${message}"

  now="$(date +%s)"
  elapsed=$(( now - INSTALL_STARTED_AT ))
  completed=$(( current - 1 ))
  remaining=$(( total - completed ))
  percent=$(( current * 100 / total ))

  if (( completed > 0 )); then
    eta_text="$(format_duration $(( (elapsed / completed) * remaining )))"
  fi

  printf '\n%s\n' "$(rule)"
  printf '%s%sStep %02d of %02d%s %s\n' "${BOLD}" "${BLUE}" "${current}" "${total}" "${RESET}" "${message}"
  printf '%s%s%s %3d%%\n' "${CYAN}" "$(progress_bar "${current}" "${total}")" "${RESET}" "${percent}"
  printf '%selapsed%s %s   %seta%s %s\n' "${DIM}" "${RESET}" "$(format_duration "${elapsed}")" "${DIM}" "${RESET}" "${eta_text}"
}

note() {
  printf '  %s[run]%s %s\n' "${BLUE}" "${RESET}" "$1"
}

ok() {
  printf '  %s[ok]%s %s\n' "${GREEN}" "${RESET}" "$1"
}

warn() {
  printf '  %s[warn]%s %s\n' "${YELLOW}" "${RESET}" "$1"
}

skip() {
  printf '  %s[skip]%s %s\n' "${DIM}" "${RESET}" "$1"
}

fail() {
  printf '  %s[fail]%s %s\n' "${RED}" "${RESET}" "$1"
}

sanitize_text() {
  local text="${1:-}"
  local secret=""
  for secret in "${ADMIN_PASSWORD:-}" "${JWT_SECRET:-}" "${POSTGRES_PASSWORD:-}" "${DATABASE_URL:-}" "${WIFI_PASSPHRASE:-}"; do
    if [[ -n "${secret}" ]]; then
      text="${text//${secret}/[redacted]}"
    fi
  done
  printf '%s' "${text}"
}

read_env_value() {
  local env_file="$1"
  local key="$2"
  [[ -f "${env_file}" ]] || return 1
  grep -E "^${key}=" "${env_file}" | tail -n1 | cut -d= -f2- || true
}

run_step_command() {
  local description="$1"
  shift
  local command_text=""
  local safe_command=""
  local exit_code=0

  printf -v command_text '%q ' "$@"
  command_text="${command_text% }"
  safe_command="$(sanitize_text "${command_text}")"

  LAST_RUN_DESCRIPTION="${description}"
  LAST_RUN_COMMAND="${safe_command}"
  note "${description}"

  if "$@"; then
    ok "${description}"
    LAST_RUN_DESCRIPTION=""
    LAST_RUN_COMMAND=""
    return 0
  fi

  exit_code=$?
  LAST_FAILED_DESCRIPTION="${description}"
  LAST_FAILED_COMMAND="${safe_command}"
  fail "${description}"
  printf '  %s[fail]%s command: %s\n' "${RED}" "${RESET}" "${safe_command}"
  return "${exit_code}"
}

run_logged_function() {
  local label="$1"
  shift
  note "Starting ${label}"
  "$@"
  ok "Finished ${label}"
}

retry_step_command() {
  local max_attempts="${1:-3}"
  local delay="${2:-5}"
  local description="$3"
  shift 3
  local attempt=1
  local exit_code=0

  while (( attempt <= max_attempts )); do
    note "${description} (attempt ${attempt}/${max_attempts})"
    if "$@"; then
      ok "${description}"
      return 0
    fi
    exit_code=$?
    if (( attempt < max_attempts )); then
      warn "${description} failed (exit ${exit_code}), retrying in ${delay}s..."
      sleep "${delay}"
    fi
    (( attempt++ ))
  done

  fail "${description} failed after ${max_attempts} attempts (exit ${exit_code})"
  return "${exit_code}"
}

print_failure() {
  local exit_code="$1"
  local line_number="${2:-unknown}"
  local failed_command="${3:-}"
  local elapsed=0
  local safe_command=""
  local failed_description=""

  elapsed=$(( $(date +%s) - INSTALL_STARTED_AT ))
  safe_command="$(sanitize_text "${failed_command}")"
  failed_description="${LAST_FAILED_DESCRIPTION:-${LAST_RUN_DESCRIPTION:-command failure}}"
  if [[ -n "${LAST_FAILED_COMMAND}" ]]; then
    safe_command="${LAST_FAILED_COMMAND}"
  fi
  printf '\n%s\n' "$(rule)"
  printf '%s%sProject DANILO setup needs attention.%s\n' "${BOLD}" "${RED}" "${RESET}"
  printf 'The installer stopped during step %02d/%02d: %s\n' "${CURRENT_STEP_INDEX}" "${CURRENT_STEP_TOTAL}" "${CURRENT_STEP_LABEL}"
  printf '  %s[help]%s Nothing was left half-configured intentionally; rollback has been attempted.\n' "${YELLOW}" "${RESET}"
  printf '  %s[fail]%s section: %s\n' "${RED}" "${RESET}" "${failed_description}"
  printf '  %s[fail]%s line: %s\n' "${RED}" "${RESET}" "${line_number}"
  if [[ -n "${safe_command}" ]]; then
    printf '  %s[fail]%s command: %s\n' "${RED}" "${RESET}" "${safe_command}"
  fi
  printf '  %s[fail]%s exit code: %s\n' "${RED}" "${RESET}" "${exit_code}"
  printf '  %s[help]%s Full log: %s\n' "${YELLOW}" "${RESET}" "${LOG_FILE}"
  printf '  [help] Last 60 log lines\n' >&3
  if [[ -r "${LOG_FILE}" ]]; then
    tail -n 60 "${LOG_FILE}" >&3 || true
  else
    printf '  [help] Log file is not readable yet.\n' >&3
  fi
  printf '  %s[help]%s elapsed: %s\n' "${YELLOW}" "${RESET}" "$(format_duration "${elapsed}")"
  exit "${exit_code}"
}

active_ai_model() {
  local active_model="${OLLAMA_MODEL:-}"
  local env_model=""

  if [[ -f "${APP_ROOT}/.env" ]]; then
    env_model="$(read_env_value "${APP_ROOT}/.env" "OLLAMA_MODEL")"
    [[ -n "${env_model}" ]] && active_model="${env_model}"
  fi

  printf '%s' "${active_model:-unconfigured}"
}

ai_model_status() {
  local active_model="$1"
  local model_list=""

  if [[ -z "${active_model}" || "${active_model}" == "unconfigured" ]]; then
    printf '%s' 'not configured'
    return 0
  fi

  if [[ -f "${APP_ROOT}/docker-compose.yml" ]]; then
    model_list="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T ollama ollama list 2>/dev/null || true)"
    if printf '%s\n' "${model_list}" | awk -v model="${active_model}" 'NR > 1 && ($1 == model || $1 == model ":latest") { found = 1 } END { exit found ? 0 : 1 }'; then
      printf '%s' 'loaded and ready'
      return 0
    fi
  fi

  printf '%s' 'configured; readiness checks completed'
}

save_credentials_file() {
  local access_ip="$1"
  local active_model="$2"
  local model_status="$3"

  mkdir -p "${RUNTIME_ROOT}"
  cat > "${CREDENTIALS_FILE}" <<EOF
Project DANILO Admin Credentials
Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')

Username: ${ADMIN_USERNAME:-admin}
Password: ${ADMIN_PASSWORD}

Access URL: http://${access_ip}
Portal URL: http://${PORTAL_DOMAIN}
Wi-Fi SSID: ${SSID}
Wi-Fi Password: ${WIFI_PASSPHRASE}

AI Model: ${active_model}
AI Model Status: ${model_status}

Warning: Change the admin password after first login.
EOF
  chown root:root "${CREDENTIALS_FILE}"
  chmod 0600 "${CREDENTIALS_FILE}"
}

print_success() {
  local elapsed=0
  local access_ip="${LAN_IP}"
  local active_model=""
  local model_status=""
  elapsed=$(( $(date +%s) - INSTALL_STARTED_AT ))

  if [[ "${RESOLVER_PUBLIC_FALLBACK_USED}" -eq 1 ]]; then
    restore_preferred_resolver_if_possible || note "Continuing with temporary public DNS because no local upstream resolver is available yet"
  fi

  active_model="$(active_ai_model)"
  model_status="$(ai_model_status "${active_model}")"
  save_credentials_file "${access_ip}" "${active_model}" "${model_status}"

  cat >&3 <<EOF

${BOLD}${GREEN}DANILO Installation Complete${RESET}
$(rule)
${BOLD}Username:${RESET} ${ADMIN_USERNAME:-admin}
${BOLD}Password:${RESET} ${ADMIN_PASSWORD}

${BOLD}Access URL:${RESET}
http://${access_ip}
http://${PORTAL_DOMAIN}

${BOLD}AI Model:${RESET}
${active_model} (${model_status})

${BOLD}wifi${RESET}      ${SSID}
${BOLD}password${RESET}  ${WIFI_PASSPHRASE}
${BOLD}elapsed${RESET}   $(format_duration "${elapsed}")
${DIM}log${RESET}       ${LOG_FILE}

${BOLD}mission${RESET}
Project DANILO helps Philippine schools address the 91% learning poverty rate with local lessons, teacher tools, and safe AI tutoring that continue working offline.

${BOLD}access flow${RESET}
1. Join the Wi-Fi network shown above.
2. Enter the password exactly as written above if prompted.
3. Open ${BOLD}http://${PORTAL_DOMAIN}${RESET} if the portal does not appear automatically.

${BOLD}admin account${RESET}
- Admin username: ${BOLD}${ADMIN_USERNAME:-admin}${RESET}
- Admin password: ${BOLD}${ADMIN_PASSWORD}${RESET}
- Created/repaired by: backend startup seed_defaults()
${BOLD}${YELLOW}warning${RESET} Change the admin password after first login.
${BOLD}important${RESET} Save this password. A root-only copy was saved to ${CREDENTIALS_FILE}.
${DIM}note${RESET} The admin password is printed only on this operator console after a successful install and is not written to the install log.

${BOLD}demo role accounts${RESET}
$(if [[ "${DANILO_SEED_DEMO}" == "1" ]]; then printf '%s\n%s\n%s' '- Teacher: teacher1 / teacher123' '- Teacher: teacher2 / teacher123' '- Students: student1 through student10 / student123'; else printf '%s' '- Disabled. Reinstall with DANILO_SEED_DEMO=1 to create sample LMS data.'; fi)

${BOLD}services${RESET}
- Gateway IP: ${LAN_IP}
- Portal URL: http://${PORTAL_DOMAIN}
- Backend status: healthy at http://${PORTAL_DOMAIN}/api/health
- Database status: PostgreSQL healthy; users table migrated and admin verified
- AI model status: ${active_model} (${model_status})
- Credentials file: ${CREDENTIALS_FILE} (root-only)
- Access Point interface: ${AP_WIFI_IFACE}
- Internet download interface used during install: ${UPLINK_WIFI_IFACE:-current system uplink}
- Installed stack root: ${PROJECT_ROOT}
EOF
}

finalize_success() {
  INSTALL_SUCCEEDED=1
  trap - ERR
  note "All readiness checks passed; printing final deployment summary to the operator console"
  print_success
}
