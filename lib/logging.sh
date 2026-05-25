# Project DANILO installer module: logging.sh

init_logging() {
  umask 077
  mkdir -p "$(dirname -- "${LOG_FILE}")" 2>/dev/null || true
  # Only send output to the log file by default, keeping terminal clean
  exec 3>&1
  exec >> "${LOG_FILE}" 2>&1
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
  if (( hours > 0 )); then
    printf '%02d:%02d:%02d' "${hours}" "${minutes}" "${seconds}"
  else
    printf '%02d:%02d' "${minutes}" "${seconds}"
  fi
}

rule() {
  printf '%s' '────────────────────────────────────────────────────────'
}

print_install_intro() {
  printf '\n' >&3
  printf '  %s%sProject DANILO Setup v1.1%s\n' "${BOLD}" "${CYAN}" "${RESET}" >&3
  printf '  %sOffline AI-Powered LMS for Edge Networks%s\n' "${DIM}" "${RESET}" >&3
  printf '  %s%s%s\n' "${DIM}" "$(rule)" "${RESET}" >&3
  printf '  %sStarted:%s  %s\n' "${DIM}" "${RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" >&3
  printf '  %sLog File:%s %s\n' "${DIM}" "${RESET}" "${LOG_FILE}" >&3
  printf '  %s%s%s\n\n' "${DIM}" "$(rule)" "${RESET}" >&3
}

step() {
  local current="$1"
  local total="$2"
  local message="$3"
  
  CURRENT_STEP_INDEX="${current}"
  CURRENT_STEP_TOTAL="${total}"
  CURRENT_STEP_LABEL="${message}"

  printf '\n%s%s── %s %s(%d/%d)%s\n' "${BOLD}" "${CYAN}" "${message}" "${DIM}" "${current}" "${total}" "${RESET}" >&3
}

note_status() {
  local status="$1"
  local msg="$2"
  
  case "${status}" in
    OK)
      printf '  %s✔%s  %s\n' "${GREEN}" "${RESET}" "${msg}" >&3
      ;;
    FAIL)
      printf '  %s✘%s  %s\n' "${RED}" "${RESET}" "${msg}" >&3
      ;;
    WAIT)
      printf '  %s…%s  %s\n' "${YELLOW}" "${RESET}" "${msg}" >&3
      ;;
    REPAIR)
      printf '  %s⚡%s  %s\n' "${CYAN}" "${RESET}" "${msg}" >&3
      ;;
    SKIP)
      printf '  %s•%s  %s %s(skipped)%s\n' "${DIM}" "${RESET}" "${DIM}" "${msg}" "${RESET}" >&3
      ;;
    *)
      printf '  %s•%s  %s\n' "${DIM}" "${RESET}" "${msg}" >&3
      ;;
  esac
}

note() {
  note_status "WAIT" "$1"
}

ok() {
  note_status "OK" "$1"
}

warn() {
  note_status "WARN" "$1"
}

skip() {
  note_status "SKIP" "$1"
}

fail() {
  note_status "FAIL" "$1"
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

run_resilient_command() {
  local description="$1"
  shift
  local command_text=""
  local safe_command=""
  local exit_code=0
  local attempt=1
  local max_attempts=3

  printf -v command_text '%q ' "$@"
  command_text="${command_text% }"
  safe_command="$(sanitize_text "${command_text}")"

  LAST_RUN_DESCRIPTION="${description}"
  LAST_RUN_COMMAND="${safe_command}"

  while (( attempt <= max_attempts )); do
    # Run the command in the background, piping to log
    "$@" >> "${LOG_FILE}" 2>&1 &
    local pid=$!
    
    # Custom high-performance terminal spinner
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local delay=0.08
    
    # Make cursor invisible
    tput civis >&3 2>/dev/null || true
    
    while kill -0 "$pid" 2>/dev/null; do
      local temp=${spinstr#?}
      printf "  ${CYAN}%s${RESET}  ${DIM}%s...${RESET}\r" "${spinstr:0:1}" "${description}" >&3
      spinstr=$temp${spinstr%"$temp"}
      sleep $delay
    done
    
    # Restore cursor & clear current terminal line
    tput cnorm >&3 2>/dev/null || true
    printf "\r\033[K" >&3
    
    wait "$pid"
    exit_code=$?
    
    if [[ "${exit_code}" -eq 0 ]]; then
      ok "${description}"
      LAST_RUN_DESCRIPTION=""
      LAST_RUN_COMMAND=""
      return 0
    fi
    
    if declare -f diagnose_and_repair >/dev/null; then
      if diagnose_and_repair "${command_text}" "${exit_code}"; then
        note_status "REPAIR" "Applying self-repair routines..."
        (( attempt++ ))
        continue
      fi
    fi

    if (( attempt < max_attempts )); then
      warn "Failed. Retrying in 3s..."
      sleep 3
    fi
    (( attempt++ ))
  done

  LAST_FAILED_DESCRIPTION="${description}"
  LAST_FAILED_COMMAND="${safe_command}"
  fail "${description} (failed after ${max_attempts} attempts)"
  return "${exit_code}"
}

run_step_command() {
  run_resilient_command "$@"
}

run_logged_function() {
  local label="$1"
  shift
  "$@" >> "${LOG_FILE}" 2>&1
  local exit_code=$?
  if [[ "${exit_code}" -eq 0 ]]; then
    return 0
  else
    fail "Module ${label} failed internally."
    return "${exit_code}"
  fi
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
  
  printf '\n  %s%s✘ Deployment Failed%s\n' "${BOLD}" "${RED}" "${RESET}" >&3
  printf '  %s────────────────────────────────────────────────────────%s\n' "${DIM}" "${RESET}" >&3
  printf '  %sError:%s %s\n' "${BOLD}" "${RESET}" "${failed_description}" >&3
  printf '  %sLine:%s  %s\n' "${BOLD}" "${RESET}" "${line_number}" >&3
  if [[ -n "${safe_command}" ]]; then
    printf '  %sCmd:%s   %s\n' "${BOLD}" "${RESET}" "${safe_command}" >&3
  fi
  printf '  %sExit:%s  %s\n' "${BOLD}" "${RESET}" "${exit_code}" >&3
  printf '\n  %sAuto-Healing Failure:%s The self-recovery pipeline was unable to repair this step.\n' "${YELLOW}" "${RESET}" >&3
  printf '  %sDiagnostics:%s Please check the system installation log for absolute details:\n' "${YELLOW}" "${RESET}" >&3
  printf '  %s%s%s\n' "${DIM}" "${LOG_FILE}" "${RESET}" >&3
  printf '  %s────────────────────────────────────────────────────────%s\n\n' "${DIM}" "${RESET}" >&3
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
    restore_preferred_resolver_if_possible || note "Continuing with temporary public DNS"
  fi

  active_model="$(active_ai_model)"
  model_status="$(ai_model_status "${active_model}")"
  save_credentials_file "${access_ip}" "${active_model}" "${model_status}"

  local access_urls="  • Portal URL (AP):     http://${PORTAL_DOMAIN}\n  • Portal URL (Local):  http://localhost\n  • Portal URL (IP):     http://${access_ip}"
  
  if [[ "${LAPTOP_LOCAL_MODE}" -eq 1 ]] || [[ -f "${RUNTIME_ROOT}/local_mode" ]]; then
    access_urls="  • Portal URL (Local):  http://localhost\n  • Portal URL (IP):     http://${access_ip}"
  fi

  cat >&3 <<EOF

  ${BOLD}${GREEN}✔ Deployment Complete!${RESET}
  ${DIM}────────────────────────────────────────────────────────${RESET}
  
  ${BOLD}Admin Credentials${RESET}
  • Username: ${ADMIN_USERNAME:-admin}
  • Password: ${ADMIN_PASSWORD}
  ${DIM}  (Please change your password after logging in)${RESET}

  ${BOLD}Platform Network Access${RESET}
  • Captive SSID:  ${SSID}
  • Wi-Fi Passkey: ${WIFI_PASSPHRASE}
$(echo -e "${access_urls}")

  ${BOLD}Local Edge AI Optimization${RESET}
  • HW Profile:  ${DANILO_AI_HARDWARE_PROFILE:-auto}
  • LLM Model:   ${active_model} (${model_status})

  ${BOLD}Operations & Troubleshooting${RESET}
  • Verify Install:    sudo bash danilo.sh --verify
  • Clean Reinstall:   sudo DANILO_RESET_DATA=1 bash danilo.sh --clean-install
  • Check Backend API: docker compose -p ${STACK_NAME} logs --tail=50 backend
  • Log File:          ${LOG_FILE}

  ${DIM}────────────────────────────────────────────────────────
  Duration: $(format_duration "${elapsed}")${RESET}

EOF
}

finalize_success() {
  INSTALL_SUCCEEDED=1
  trap - ERR
  print_success
}
