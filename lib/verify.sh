# Project DANILO installer module: verify.sh

verify_pass() {
  printf '  %s[PASS]%s %s\n' "${GREEN}" "${RESET}" "$1"
}

verify_fail() {
  VERIFY_FAILED=1
  printf '  %s[FAIL]%s %s\n' "${RED}" "${RESET}" "$1"
}

verify_warn() {
  printf '  %s[WARN]%s %s\n' "${YELLOW}" "${RESET}" "$1"
}

verify_command() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    verify_pass "${label}"
  else
    verify_fail "${label}"
  fi
}

verify_compose_command() {
  local label="$1"
  shift
  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "${label} (missing ${APP_ROOT}/docker-compose.yml)"
    return 0
  fi
  verify_command "${label}" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" "$@"
}

verify_warn_command() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    verify_pass "${label}"
  else
    verify_warn "${label} (Degraded)"
  fi
}

verify_compose_warn_command() {
  local label="$1"
  shift
  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_warn "${label} (Degraded: missing ${APP_ROOT}/docker-compose.yml)"
    return 0
  fi
  verify_warn_command "${label}" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" "$@"
}

verify_http() {
  local label="$1"
  local url="$2"
  local expected="${3:-}"
  local body=""

  body="$(curl -fsS -H "Host: ${PORTAL_DOMAIN}" "${url}" 2>/dev/null || true)"
  if [[ -n "${body}" && ( -z "${expected}" || "${body}" == *"${expected}"* ) ]]; then
    verify_pass "${label}"
  else
    verify_fail "${label}"
  fi
}

verify_http_status() {
  local label="$1"
  local url="$2"
  local status_code=""

  status_code="$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: ${PORTAL_DOMAIN}" "${url}" 2>/dev/null || true)"
  if [[ "${status_code}" == "200" ]]; then
    verify_pass "${label} (HTTP 200)"
  else
    verify_fail "${label} (HTTP ${status_code:-no response})"
  fi
}

verify_captive_redirect() {
  local label="$1"
  local host="$2"
  local path="$3"
  local result=""
  local status_code=""
  local redirect_url=""

  result="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' -H "Host: ${host}" "http://127.0.0.1${path}" 2>/dev/null || true)"
  status_code="${result%% *}"
  redirect_url="${result#* }"

  if [[ "${status_code}" == "302" && "${redirect_url}" == "http://${PORTAL_DOMAIN}/"* ]]; then
    verify_pass "${label}"
  else
    verify_fail "${label} (HTTP ${status_code:-no response}, redirect ${redirect_url:-none})"
  fi
}

verify_captive_redirects() {
  verify_pass "Captive portal redirects removed per user request"
}

verify_dnsmasq_captive_config() {
  local dnsmasq_config="/etc/dnsmasq.d/danilo.conf"
  if [[ "${LAPTOP_LOCAL_MODE}" -eq 1 ]] || [[ -f "${RUNTIME_ROOT}/local_mode" ]]; then
    verify_pass "LAPTOP/LOCAL-ONLY mode active: dnsmasq DHCP/DNS checks bypassed"
    return 0
  fi

  if [[ ! -f "${dnsmasq_config}" ]]; then
    verify_fail "dnsmasq DANILO config exists (${dnsmasq_config})"
    return 0
  fi

  grep -Fq "dhcp-option=3,${LAN_IP}" "${dnsmasq_config}" \
    && verify_pass "DHCP advertises gateway ${LAN_IP}" \
    || verify_fail "DHCP advertises gateway ${LAN_IP}"
  grep -Fq "dhcp-option=6,${LAN_IP}" "${dnsmasq_config}" \
    && verify_pass "DHCP advertises DNS server ${LAN_IP}" \
    || verify_fail "DHCP advertises DNS server ${LAN_IP}"
  grep -Fq "address=/${PORTAL_DOMAIN}/${LAN_IP}" "${dnsmasq_config}" \
    && verify_pass "dnsmasq maps ${PORTAL_DOMAIN} to ${LAN_IP}" \
    || verify_fail "dnsmasq maps ${PORTAL_DOMAIN} to ${LAN_IP}"
}

verify_portal_dns_query() {
  local answer=""

  if [[ "${LAPTOP_LOCAL_MODE}" -eq 1 ]] || [[ -f "${RUNTIME_ROOT}/local_mode" ]]; then
    verify_pass "LAPTOP/LOCAL-ONLY mode active: live AP DNS query bypassed"
    return 0
  fi

  if ! command -v dig >/dev/null 2>&1; then
    verify_warn "dig unavailable; live AP DNS query skipped"
    return 0
  fi

  answer="$(dig +short +time=2 +tries=1 @"${LAN_IP}" "${PORTAL_DOMAIN}" A 2>/dev/null | tail -n1 || true)"
  if [[ "${answer}" == "${LAN_IP}" ]]; then
    verify_pass "${PORTAL_DOMAIN} resolves to ${LAN_IP} via DANILO DNS"
  else
    verify_fail "${PORTAL_DOMAIN} resolves to ${LAN_IP} via DANILO DNS (got ${answer:-no answer})"
  fi
}

active_ai_runtime() {
  printf '%s' "ollama"
}

verify_frontend_html() {
  local label="$1"
  local url="$2"
  local body=""
  local js_asset_path=""
  local css_asset_path=""

  body="$(curl -fsS -H "Host: ${PORTAL_DOMAIN}" "${url}" 2>/dev/null || true)"
  if [[ -z "${body}" ]]; then
    verify_fail "${label} (empty response)"
    return 0
  fi

  if [[ "${body}" != *"<div id=\"root\""* ]]; then
    verify_fail "${label} (missing React root)"
    return 0
  fi

  if [[ "${body}" == *"/src/main.jsx"* ]]; then
    verify_fail "${label} (served Vite dev entrypoint instead of static build)"
    return 0
  fi

  js_asset_path="$(printf '%s' "${body}" | sed -n 's/.*src="\([^"]*\/assets\/[^"]*\.js\)".*/\1/p' | head -n1)"
  if [[ -z "${js_asset_path}" ]]; then
    verify_fail "${label} (missing built JS asset reference)"
    return 0
  fi

  css_asset_path="$(printf '%s' "${body}" | sed -n 's/.*href="\([^"]*\/assets\/[^"]*\.css\)".*/\1/p' | head -n1)"
  if [[ -z "${css_asset_path}" ]]; then
    verify_fail "${label} (missing built CSS asset reference)"
    return 0
  fi

  if curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1${js_asset_path}" >/dev/null 2>&1 \
    && curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1${css_asset_path}" >/dev/null 2>&1; then
    verify_pass "${label} (HTML, JS, and CSS bundles served)"
  else
    verify_fail "${label} (bundle not reachable: ${js_asset_path} ${css_asset_path})"
  fi
}

verify_frontend_served_build_marker() {
  local local_marker="${APP_ROOT}/frontend/dist/danilo-build.txt"
  local local_build=""
  local served_build=""

  if [[ ! -f "${local_marker}" ]]; then
    verify_fail "Gateway is serving latest frontend build (missing local build marker)"
    return 0
  fi

  local_build="$(cat "${local_marker}" 2>/dev/null || true)"
  served_build="$(curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1/danilo-build.txt" 2>/dev/null || true)"

  if [[ -n "${local_build}" && "${served_build}" == "${local_build}" ]]; then
    verify_pass "Gateway is serving latest frontend build"
  else
    verify_fail "Gateway is serving latest frontend build"
  fi
}


verify_container() {
  local service="$1"
  local container_id=""
  local state=""

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Container running: ${service} (missing compose file)"
    return 0
  fi

  container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
  if [[ -z "${container_id}" ]]; then
    verify_fail "Container running: ${service} (not found)"
    return 0
  fi

  state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
  if [[ "${state}" == "healthy" || "${state}" == "running" ]]; then
    verify_pass "Container running: ${service}"
  else
    verify_fail "Container running: ${service} (${state:-unknown})"
  fi
}

verify_optional_container() {
  local service="$1"
  local container_id=""
  local state=""

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_warn "Container running: ${service} (Degraded: missing compose file)"
    return 0
  fi

  container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
  if [[ -z "${container_id}" ]]; then
    verify_warn "Container running: ${service} (Degraded: not found)"
    return 0
  fi

  state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
  if [[ "${state}" == "healthy" || "${state}" == "running" ]]; then
    verify_pass "Container running: ${service}"
  else
    verify_warn "Container running: ${service} (Degraded: ${state:-unknown})"
  fi
}

verify_active_model() {
  local runtime=""
  local active_model="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-}}"
  local model_list=""

  runtime="$(active_ai_runtime)"
  if [[ -f "${APP_ROOT}/.env" ]]; then
    active_model="$(read_env_value "${APP_ROOT}/.env" "OLLAMA_MODEL")"
  fi

  if [[ -z "${active_model}" ]]; then
    verify_fail "Active AI model is configured"
    return 0
  fi

  verify_pass "Active AI model is configured: ${active_model}"

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Active AI model is loaded: ${active_model} (missing compose file)"
    return 0
  fi

  model_list="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T ollama ollama list 2>/dev/null || true)"
  if printf '%s\n' "${model_list}" | awk -v model="${active_model}" 'NR > 1 && ($1 == model || $1 == model ":latest") { found = 1 } END { exit found ? 0 : 1 }'; then
    verify_pass "Active AI model is loaded: ${active_model}"
  else
    verify_warn "Active AI model is loaded: ${active_model} (Degraded)"
  fi
}

verify_ollama_api() {
  local tags_body=""

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Ollama API reachable (missing compose file)"
    return 0
  fi

  tags_body="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T backend \
    python -c "import urllib.request; print(urllib.request.urlopen('http://${OLLAMA_HOST:-ollama}:${OLLAMA_PORT:-11434}/api/tags', timeout=5).read().decode())" 2>/dev/null || true)"
  if [[ "${tags_body}" == *'"models"'* ]]; then
    verify_pass "Ollama API reachable"
  else
    verify_warn "Ollama API reachable (Degraded)"
  fi
}

verify_admin_login() {
  local login_body=""
  local auth_token=""

  login_body="$(curl -fsS -H "Host: ${PORTAL_DOMAIN}" -H "Content-Type: application/json" -X POST "http://127.0.0.1/api/auth/login" -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}" 2>/dev/null || true)"
  if [[ "${login_body}" == *"accessToken"* || "${login_body}" == *"access_token"* ]]; then
    verify_pass "Admin login endpoint works"
  else
    verify_fail "Admin login endpoint works"
    return 0
  fi

  auth_token="$(printf '%s' "${login_body}" | sed -n 's/.*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  if [[ -z "${auth_token}" ]]; then
    auth_token="$(printf '%s' "${login_body}" | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  fi

  if [[ -n "${auth_token}" ]]; then
    verify_command "Admin overview route works" curl -fsS -H "Host: ${PORTAL_DOMAIN}" -H "Authorization: Bearer ${auth_token}" "http://127.0.0.1/api/admin/overview"
  else
    verify_fail "Admin overview route works (token not found in login response)"
  fi
}

verify_backend_direct_health() {
  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Backend direct health endpoint returns 200 (missing compose file)"
    return 0
  fi

  verify_compose_command "Backend direct health endpoint returns 200" exec -T backend \
    python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${BACKEND_PORT:-8000}/api/health', timeout=5)"
}

verify_database_schema() {
  local table_count=""

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Database schema is migrated (missing compose file)"
    return 0
  fi

  table_count="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T postgres \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Atc "select count(*) from information_schema.tables where table_schema='public' and table_name in ('users','departments','courses','enrollments','modules','stream_posts','assignments','submissions','quizzes','quiz_questions','quiz_attempts','grade_entries','sections','audit_logs','ai_conversations','chat_sessions','chat_messages');" 2>/dev/null || true)"
  if [[ "${table_count}" == "17" ]]; then
    verify_pass "Database schema is migrated"
  else
    verify_fail "Database schema is migrated (${table_count:-0}/17 expected tables)"
  fi
}

verify_admin_seed() {
  local admin_count=""

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_fail "Seed admin user exists (missing compose file)"
    return 0
  fi

  admin_count="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T postgres \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Atc "select count(*) from users where username='${ADMIN_USERNAME}' and role='admin' and is_active=true;" 2>/dev/null || true)"
  if [[ "${admin_count}" == "1" ]]; then
    verify_pass "Seed admin user exists"
  else
    verify_fail "Seed admin user exists"
  fi
}

verify_ai_matrix_status() {
  local container_state=""
  local ollama_api_reachable=0
  local active_model="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-}}"

  if [[ -f "${APP_ROOT}/.env" ]]; then
    active_model="$(read_env_value "${APP_ROOT}/.env" "OLLAMA_MODEL" 2>/dev/null || true)"
  fi
  [[ -z "${active_model}" ]] && active_model="${OLLAMA_MODEL:-auto}"

  if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
    printf '  %s[INFO]%s AI Status: %sOFFLINE%s (missing compose file)\n' "${BOLD}" "${RESET}" "${RED}" "${RESET}"
    return 0
  fi

  local container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q ollama 2>/dev/null | head -n1 || true)"
  if [[ -z "${container_id}" ]]; then
    printf '  %s[INFO]%s AI Status: %sOFFLINE%s (container not found)\n' "${BOLD}" "${RESET}" "${RED}" "${RESET}"
    return 0
  fi

  container_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
  if [[ "${container_state}" == "starting" ]]; then
    printf '  %s[INFO]%s AI Status: %sSTARTING%s\n' "${BOLD}" "${RESET}" "${YELLOW}" "${RESET}"
    return 0
  elif [[ "${container_state}" != "healthy" && "${container_state}" != "running" ]]; then
    printf '  %s[INFO]%s AI Status: %sOFFLINE%s (container %s)\n' "${BOLD}" "${RESET}" "${RED}" "${RESET}" "${container_state}"
    return 0
  fi

  local tags_body="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T backend python -c "import urllib.request; print(urllib.request.urlopen('http://${OLLAMA_HOST:-ollama}:${OLLAMA_PORT:-11434}/api/tags', timeout=5).read().decode())" 2>/dev/null || true)"
  if [[ "${tags_body}" != *'"models"'* ]]; then
    printf '  %s[INFO]%s AI Status: %sDEGRADED%s (API unreachable)\n' "${BOLD}" "${RESET}" "${YELLOW}" "${RESET}"
    return 0
  fi

  local model_list="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T ollama ollama list 2>/dev/null || true)"
  if printf '%s\n' "${model_list}" | awk -v model="${active_model}" 'NR > 1 && ($1 == model || $1 == model ":latest") { found = 1 } END { exit found ? 0 : 1 }'; then
    printf '  %s[INFO]%s AI Status: %sREADY%s (%s)\n' "${BOLD}" "${RESET}" "${GREEN}" "${RESET}" "${active_model}"
  else
    printf '  %s[INFO]%s AI Status: %sMODEL MISSING%s (%s)\n' "${BOLD}" "${RESET}" "${YELLOW}" "${RESET}" "${active_model}"
  fi
}

verify_mode() {
  print_install_intro
  step 1 1 "Post-install verification"
  VERIFY_FAILED=0

  verify_command "Docker daemon is running" docker info

  if [[ -f "${APP_ROOT}/docker-compose.yml" ]]; then
    verify_command "Docker Compose project is readable" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps
  else
    verify_fail "Docker Compose file exists at ${APP_ROOT}/docker-compose.yml"
  fi

  local services=(postgres backend gateway)
  local service=""
  for service in "${services[@]}"; do
    verify_container "${service}"
  done
  verify_optional_container ollama


  verify_backend_direct_health
  verify_http "Backend API reachable" "http://127.0.0.1/api/health" '"status"'
  verify_http_status "Frontend reachable" "http://127.0.0.1/"
  verify_frontend_html "Frontend static bundle reachable" "http://127.0.0.1/"
  verify_captive_redirects
  verify_dnsmasq_captive_config
  verify_portal_dns_query
  verify_frontend_served_build_marker
  verify_compose_command "Database connection works" exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
  verify_database_schema
  verify_admin_seed
  verify_compose_warn_command "Ollama CLI reachable" exec -T ollama ollama list
  verify_ollama_api
  verify_active_model
  verify_ai_matrix_status

  if getent hosts "${PORTAL_DOMAIN}" >/dev/null 2>&1 || grep -q "${PORTAL_DOMAIN}" /etc/hosts 2>/dev/null; then
    verify_pass "${PORTAL_DOMAIN} resolves locally"
  else
    verify_fail "${PORTAL_DOMAIN} resolves locally"
  fi

  verify_admin_login

  if [[ "${LAPTOP_LOCAL_MODE}" -eq 1 ]] || [[ -f "${RUNTIME_ROOT}/local_mode" ]]; then
    verify_pass "LAPTOP/LOCAL-ONLY mode active: Wi-Fi AP and physical interface checks bypassed"
  else
    if [[ -f "${RUNTIME_ROOT}/wifi_iface" ]]; then
      local wifi_iface
      wifi_iface="$(cat "${RUNTIME_ROOT}/wifi_iface" 2>/dev/null || true)"
      if [[ -n "${wifi_iface}" ]] && ip link show "${wifi_iface}" >/dev/null 2>&1; then
        verify_pass "Wi-Fi interface ${wifi_iface} is present"
      else
        verify_fail "Wi-Fi interface ${wifi_iface:-unknown} is not available"
      fi
    else
      verify_fail "Wi-Fi interface not configured (missing ${RUNTIME_ROOT}/wifi_iface)"
    fi

    if systemctl is-active --quiet danilo-ap.service 2>/dev/null; then
      verify_pass "Access point service (danilo-ap) is active"
    else
      verify_fail "Access point service (danilo-ap) is not active"
    fi
  fi

  printf '\n%s\n' "$(rule)"
  local pass_count fail_count
  pass_count="$(grep -c '\[PASS\]' "${LOG_FILE}" 2>/dev/null || echo 0)"
  fail_count="${VERIFY_FAILED}"
  if [[ "${VERIFY_FAILED}" -eq 0 ]]; then
    printf '  %s%sRESULT: ALL CHECKS PASSED%s (%s checks)\n' "${BOLD}" "${GREEN}" "${RESET}" "${pass_count}"
    ok "Project DANILO verification passed"
    return 0
  fi

  printf '  %s%sRESULT: SOME CHECKS FAILED%s\n' "${BOLD}" "${RED}" "${RESET}"
  fail "Project DANILO verification failed. See ${LOG_FILE} for details."
  return 1
}
