# Project DANILO installer module: recovery.sh

diagnose_and_repair() {
  local failed_command="$1"
  local exit_code="$2"
  
  if [[ "${failed_command}" == *"apt-get"* || "${failed_command}" == *"dpkg"* ]]; then
    if grep -q "Could not get lock" "${LOG_FILE}" || grep -q "Resource temporarily unavailable" "${LOG_FILE}"; then
      note_status "REPAIR" "Apt package manager is locked. Attempting to clear stale locks..."
      rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock
      dpkg --configure -a >> "${LOG_FILE}" 2>&1 || true
      return 0
    fi
    if grep -q "Unmet dependencies" "${LOG_FILE}" || grep -q "broken packages" "${LOG_FILE}"; then
      note_status "REPAIR" "Broken packages detected. Attempting automatic fix..."
      apt-get --fix-broken install -y -qq >> "${LOG_FILE}" 2>&1
      return 0
    fi
  fi

  if [[ "${failed_command}" == *"docker"* ]]; then
    if grep -q "Cannot connect to the Docker daemon" "${LOG_FILE}" || grep -q "Is the docker daemon running" "${LOG_FILE}"; then
      note_status "REPAIR" "Docker daemon crashed or is unresponsive. Restarting..."
      systemctl restart docker >> "${LOG_FILE}" 2>&1
      sleep 3
      return 0
    fi
  fi
  
  if [[ "${failed_command}" == *"systemctl start"* ]]; then
    note_status "REPAIR" "Service failed to start. Resetting failed state..."
    systemctl reset-failed >> "${LOG_FILE}" 2>&1
    return 0
  fi
  
  return 1 # No known repair applied
}

rollback_partial_deploy() {
  note_status "ROLLBACK" "Cleaning up partial deployment states to preserve data safety..."
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -p "${STACK_NAME:-danilo}" down --remove-orphans >/dev/null 2>&1 || true
  fi
  if systemctl is-active --quiet danilo-stack.service; then
    systemctl stop danilo-stack.service >/dev/null 2>&1 || true
  fi
  if systemctl is-active --quiet danilo-ap.service; then
    systemctl stop danilo-ap.service >/dev/null 2>&1 || true
  fi
}

handle_fatal_error() {
  local exit_code="$1"
  local line_number="$2"
  
  if [[ "${INSTALL_SUCCEEDED:-0}" -eq 1 ]]; then
    return 0
  fi
  
  # Ensure terminal is reset
  printf '%s' "${RESET}"
  
  print_failure "${exit_code}" "${line_number}" "${LAST_RUN_COMMAND:-Unknown command}"
  
  rollback_partial_deploy
  
  exit "${exit_code}"
}
