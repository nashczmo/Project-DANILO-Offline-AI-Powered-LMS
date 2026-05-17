# Project DANILO installer module: database.sh

generate_secrets() {
  local previous_env="${BACKUP_ROOT}/env.last"

  PORTAL_DOMAIN="${DANILO_PORTAL_DOMAIN:-${PORTAL_DOMAIN:-danilo.local}}"
  SSID="${DANILO_SSID:-${SSID:-PROJECT-DANILO}}"
  WIFI_PASSPHRASE="${DANILO_WIFI_PASSPHRASE:-${WIFI_PASSPHRASE:-ProjectDANILO2026!}}"
  DANILO_AI_RUNTIME="${DANILO_AI_RUNTIME:-${DANILO_AI_RUNTIME:-llamacpp}}"
  OLLAMA_MODEL="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-phi3:mini}}"
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
  # Generate a random admin password on first install; never expose a static default in version control
  if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
    ADMIN_PASSWORD="$(openssl rand -base64 15 | tr -d '/+=\r\n' | head -c 18)"
    DANILO_FIRST_INSTALL_PASSWORD=1
  fi
  if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
  fi
}

validate_runtime_environment() {
  local required_var=""
  local missing=()

  for required_var in ADMIN_PASSWORD ADMIN_USERNAME JWT_SECRET POSTGRES_PASSWORD DATABASE_URL WIFI_PASSPHRASE OLLAMA_MODEL SSID PORTAL_DOMAIN POSTGRES_DB POSTGRES_USER DANILO_AI_RUNTIME; do
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
COMPOSE_PROFILES=${DANILO_AI_RUNTIME:-llamacpp}
OLLAMA_URL=http://ollama:11434
LLAMA_CPP_URL=http://llamacpp:8080
DANILO_AI_RUNTIME=${DANILO_AI_RUNTIME:-llamacpp}
DANILO_OLLAMA_MODEL=${OLLAMA_MODEL}
OLLAMA_MODEL=${OLLAMA_MODEL}
DANILO_AI_PRIMARY_MODEL=${DANILO_AI_PRIMARY_MODEL:-Phi-3-mini-4k-instruct-q4_k_m.gguf}
DANILO_AI_FALLBACK_MODEL=${DANILO_AI_FALLBACK_MODEL:-gemma-2-2b-it-q4_k_m.gguf}
DANILO_AI_OPTIONAL_MODEL=${DANILO_AI_OPTIONAL_MODEL:-}
DANILO_AI_MAX_CONCURRENT=${DANILO_AI_MAX_CONCURRENT:-1}
DANILO_AI_QUEUE_TIMEOUT_SECONDS=${DANILO_AI_QUEUE_TIMEOUT_SECONDS:-45}
DANILO_AI_TIMEOUT_SECONDS=${DANILO_AI_TIMEOUT_SECONDS:-90}
DANILO_AI_NUM_CTX=${DANILO_AI_NUM_CTX:-1536}
DANILO_AI_THREADS=${DANILO_AI_THREADS:-4}
DANILO_AI_COOLDOWN_SECONDS=${DANILO_AI_COOLDOWN_SECONDS:-4}
DANILO_AI_INDEX_PATH=/var/lib/danilo/ai_index.sqlite3
OLLAMA_NUM_PARALLEL=${OLLAMA_NUM_PARALLEL:-1}
OLLAMA_MAX_LOADED_MODELS=${OLLAMA_MAX_LOADED_MODELS:-1}
OLLAMA_KEEP_ALIVE=${OLLAMA_KEEP_ALIVE:-5m}
OLLAMA_TIMEOUT_SECONDS=${OLLAMA_TIMEOUT_SECONDS:-90}
OLLAMA_NUM_CTX=${OLLAMA_NUM_CTX:-1536}
OLLAMA_CONTEXT_CHARS=${OLLAMA_CONTEXT_CHARS:-2600}
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

setup_automated_backups() {
  note "Configuring daily automated database backups"
  local backup_script="/usr/local/bin/danilo-backup.sh"
  
  cat > "${backup_script}" <<EOF
#!/usr/bin/env bash
# Automated Postgres backup for Project DANILO
set -e
BACKUP_DIR="/var/backups/danilo"
mkdir -p "\${BACKUP_DIR}"
cd /opt/danilo/app && docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "\${BACKUP_DIR}/danilo-db-\$(date +%F).sql"
# Keep last 7 days of backups
find "\${BACKUP_DIR}" -name "danilo-db-*.sql" -type f -mtime +7 -delete
EOF

  chmod +x "${backup_script}"
  chown root:root "${backup_script}"

  local cron_job="0 2 * * * root ${backup_script} > /dev/null 2>&1"
  local cron_file="/etc/cron.d/danilo-backup"
  
  if [[ -d "/etc/cron.d" ]]; then
    echo "${cron_job}" > "${cron_file}"
    chmod 0644 "${cron_file}"
    chown root:root "${cron_file}"
  else
    warn "cron.d not found on this system. Automated backups not scheduled."
  fi
}
