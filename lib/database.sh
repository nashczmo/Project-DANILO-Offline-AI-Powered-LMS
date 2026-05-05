# Project DANILO installer module: database.sh

generate_secrets() {
  local previous_env="${BACKUP_ROOT}/env.last"

  PORTAL_DOMAIN="${DANILO_PORTAL_DOMAIN:-${PORTAL_DOMAIN:-danilo.local}}"
  SSID="${DANILO_SSID:-${SSID:-PROJECT-DANILO}}"
  WIFI_PASSPHRASE="${DANILO_WIFI_PASSPHRASE:-${WIFI_PASSPHRASE:-ProjectDANILO2026!}}"
  OLLAMA_MODEL="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-qwen2.5:1.5b-instruct-q4_K_M}}"
  POSTGRES_DB="${DANILO_POSTGRES_DB:-${POSTGRES_DB:-danilo}}"
  POSTGRES_USER="${DANILO_POSTGRES_USER:-${POSTGRES_USER:-danilo}}"
  JWT_SECRET="${DANILO_JWT_SECRET:-${JWT_SECRET:-}}"
  POSTGRES_PASSWORD="${DANILO_POSTGRES_PASSWORD:-${POSTGRES_PASSWORD:-}}"
  ADMIN_USERNAME="${DANILO_ADMIN_USERNAME:-${ADMIN_USERNAME:-}}"
  ADMIN_PASSWORD="${DANILO_ADMIN_PASSWORD:-${ADMIN_PASSWORD:-}}"
  DATABASE_URL="${DANILO_DATABASE_URL:-${DATABASE_URL:-}}"

  if [[ -f "${previous_env}" ]]; then
    [[ -z "${JWT_SECRET:-}" ]] && JWT_SECRET="$(read_env_value "${previous_env}" "JWT_SECRET")"
    [[ -z "${POSTGRES_PASSWORD:-}" ]] && POSTGRES_PASSWORD="$(read_env_value "${previous_env}" "POSTGRES_PASSWORD")"
    [[ -z "${ADMIN_USERNAME:-}" ]] && ADMIN_USERNAME="$(read_env_value "${previous_env}" "ADMIN_USERNAME")"
    [[ -z "${ADMIN_PASSWORD:-}" ]] && ADMIN_PASSWORD="$(read_env_value "${previous_env}" "ADMIN_PASSWORD")"
    [[ -z "${DATABASE_URL:-}" ]] && DATABASE_URL="$(read_env_value "${previous_env}" "DATABASE_URL")"
  fi

  [[ -z "${JWT_SECRET:-}" ]] && JWT_SECRET="$(openssl rand -hex 32 | tr -d '\r\n')"
  [[ -z "${POSTGRES_PASSWORD:-}" ]] && POSTGRES_PASSWORD="$(openssl rand -hex 24 | tr -d '\r\n')"
  [[ -z "${ADMIN_USERNAME:-}" ]] && ADMIN_USERNAME="admin"
  [[ -z "${ADMIN_PASSWORD:-}" ]] && ADMIN_PASSWORD="ProjectDANILO2026!"
  if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
  fi
}

validate_runtime_environment() {
  local required_var=""
  local missing=()

  for required_var in ADMIN_PASSWORD ADMIN_USERNAME JWT_SECRET POSTGRES_PASSWORD DATABASE_URL WIFI_PASSPHRASE OLLAMA_MODEL SSID PORTAL_DOMAIN POSTGRES_DB POSTGRES_USER; do
    if [[ -z "${!required_var:-}" ]]; then
      missing+=("${required_var}")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    printf 'Installer runtime configuration is incomplete. Missing: %s\n' "${missing[*]}"
    exit 1
  fi
}

write_env_file() {
  mkdir -p "${BACKUP_ROOT}" "${APP_ROOT}"
  cat > "${APP_ROOT}/.env" <<EOF
DATABASE_URL=${DATABASE_URL}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
SECRET_KEY=${JWT_SECRET}
JWT_EXPIRE_MINUTES=720
OLLAMA_URL=http://ollama:11434
DANILO_OLLAMA_MODEL=${OLLAMA_MODEL}
OLLAMA_MODEL=${OLLAMA_MODEL}
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_KEEP_ALIVE=10m
OLLAMA_TIMEOUT_SECONDS=120
OLLAMA_NUM_CTX=1024
OLLAMA_CONTEXT_CHARS=1800
SSID=${SSID}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
PORTAL_DOMAIN=${PORTAL_DOMAIN}
DANILO_SEED_DEMO=${DANILO_SEED_DEMO}
FRONTEND_URL=http://${PORTAL_DOMAIN}
API_BASE_URL=/api
CORS_ORIGINS=http://${PORTAL_DOMAIN},http://${LAN_IP},http://localhost:5173,http://127.0.0.1:5173
EOF
  chown root:root "${APP_ROOT}/.env"
  chmod 0600 "${APP_ROOT}/.env"
  install -o root -g root -m 0600 "${APP_ROOT}/.env" "${BACKUP_ROOT}/env.last"
  note "Runtime secrets were written with restricted file permissions"
}

