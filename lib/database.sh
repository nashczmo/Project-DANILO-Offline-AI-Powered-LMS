# Project DANILO installer module: database.sh

generate_secrets() {
  local previous_env="${BACKUP_ROOT}/env.last"

  PORTAL_DOMAIN="${DANILO_PORTAL_DOMAIN:-${PORTAL_DOMAIN:-danilo.apc.edu.ph}}"
  SSID="${DANILO_SSID:-${SSID:-PROJECT-DANILO}}"
  WIFI_PASSPHRASE="${DANILO_WIFI_PASSPHRASE:-${WIFI_PASSPHRASE:-}}"
  DANILO_AI_RUNTIME="ollama"
  OLLAMA_MODEL="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-auto}}"
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
  [[ -z "${WIFI_PASSPHRASE:-}" ]] && WIFI_PASSPHRASE="$(openssl rand -base64 18 | tr -d '/+=\r\n' | head -c 20)"
  [[ -z "${ADMIN_USERNAME:-}" ]] && ADMIN_USERNAME="admin"
  # Generate a random admin password on first install; never expose a static default in version control
  if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
    ADMIN_PASSWORD="$(openssl rand -base64 15 | tr -d '/+=\r\n' | head -c 18)"
    DANILO_FIRST_INSTALL_PASSWORD=1
  fi
  if [[ -z "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
  fi

  for secret_value in JWT_SECRET POSTGRES_PASSWORD ADMIN_PASSWORD WIFI_PASSPHRASE; do
    local lowered_secret="${!secret_value}"
    lowered_secret="${lowered_secret,,}"
    case "${lowered_secret}" in
      change-me|changeme|default|password|projectdanilo2026!)
        fail "Refusing insecure placeholder value for ${secret_value}. Set a strong unique value."
        exit 1
        ;;
    esac
  done
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
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-80}
OLLAMA_HOST=${OLLAMA_HOST:-ollama}
OLLAMA_PORT=${OLLAMA_PORT:-11434}
JWT_SECRET=${JWT_SECRET}
SECRET_KEY=${JWT_SECRET}
JWT_EXPIRE_MINUTES=720
COMPOSE_PROFILES=ollama
OLLAMA_URL=http://${OLLAMA_HOST:-ollama}:${OLLAMA_PORT:-11434}
DANILO_AI_RUNTIME=ollama
DANILO_OLLAMA_MODEL=${OLLAMA_MODEL}
OLLAMA_MODEL=${OLLAMA_MODEL}
DANILO_AI_PRIMARY_MODEL=${DANILO_AI_PRIMARY_MODEL:-}
DANILO_AI_FALLBACK_MODEL=${DANILO_AI_FALLBACK_MODEL:-}
DANILO_AI_OPTIONAL_MODEL=${DANILO_AI_OPTIONAL_MODEL:-}
DANILO_AI_MODEL_LOW=${DANILO_AI_MODEL_LOW:-gemma3:4b}
DANILO_AI_MODEL_MID=${DANILO_AI_MODEL_MID:-${DANILO_AI_MODEL_BALANCED:-gemma2:9b}}
DANILO_AI_MODEL_BALANCED=${DANILO_AI_MODEL_BALANCED:-gemma2:9b}
DANILO_AI_MODEL_GPU=${DANILO_AI_MODEL_GPU:-gemma3:12b}
DANILO_AI_MODEL_HIGH=${DANILO_AI_MODEL_HIGH:-gemma3:27b}
DANILO_AI_MODEL_CLASS=${DANILO_AI_MODEL_CLASS:-auto}
DANILO_AI_QUANTIZATION=${DANILO_AI_QUANTIZATION:-auto}
DANILO_AI_GPU_LAYERS=${DANILO_AI_GPU_LAYERS:-${OLLAMA_NUM_GPU:-0}}
DANILO_AI_SCHEDULER=${DANILO_AI_SCHEDULER:-fair-queue}
DANILO_AI_MAX_CONCURRENT=${DANILO_AI_MAX_CONCURRENT:-1}
DANILO_AI_QUEUE_TIMEOUT_SECONDS=${DANILO_AI_QUEUE_TIMEOUT_SECONDS:-45}
DANILO_AI_TIMEOUT_SECONDS=${DANILO_AI_TIMEOUT_SECONDS:-${OLLAMA_TIMEOUT_SECONDS:-120}}
DANILO_AI_NUM_CTX=${DANILO_AI_NUM_CTX:-${OLLAMA_NUM_CTX:-1536}}
DANILO_AI_THREADS=${DANILO_AI_THREADS:-4}
DANILO_AI_COOLDOWN_SECONDS=${DANILO_AI_COOLDOWN_SECONDS:-4}
DANILO_AI_INDEX_PATH=/var/lib/danilo/ai_index.sqlite3
DANILO_AI_HARDWARE_PROFILE=${DANILO_AI_HARDWARE_PROFILE:-auto}
DANILO_AI_RAM_MB=${DANILO_AI_RAM_MB:-0}
DANILO_AI_CPU_COUNT=${DANILO_AI_CPU_COUNT:-0}
DANILO_AI_GPU_VRAM_MB=${DANILO_AI_GPU_VRAM_MB:-0}
DANILO_AI_CPU_MODEL=${DANILO_AI_CPU_MODEL:-unknown}
DANILO_AI_GPU_NAME=${DANILO_AI_GPU_NAME:-none}
DANILO_AI_INTEGRATED_GPU=${DANILO_AI_INTEGRATED_GPU:-0}
DANILO_AI_DEDICATED_GPU=${DANILO_AI_DEDICATED_GPU:-0}
DANILO_AI_CUDA=${DANILO_AI_CUDA:-0}
DANILO_AI_ROCM=${DANILO_AI_ROCM:-0}
DANILO_AI_AVX2=${DANILO_AI_AVX2:-0}
DANILO_AI_AVX512=${DANILO_AI_AVX512:-0}
DANILO_AI_VULKAN=${DANILO_AI_VULKAN:-0}
DANILO_AI_OPENCL=${DANILO_AI_OPENCL:-0}
DANILO_AI_STORAGE_AVAILABLE_MB=${DANILO_AI_STORAGE_AVAILABLE_MB:-0}
DANILO_AI_LOW_VRAM=${DANILO_AI_LOW_VRAM:-0}
OLLAMA_NUM_PARALLEL=${OLLAMA_NUM_PARALLEL:-1}
OLLAMA_MAX_LOADED_MODELS=${OLLAMA_MAX_LOADED_MODELS:-1}
OLLAMA_KEEP_ALIVE=${OLLAMA_KEEP_ALIVE:-3m}
OLLAMA_TIMEOUT_SECONDS=${OLLAMA_TIMEOUT_SECONDS:-120}
OLLAMA_NUM_CTX=${OLLAMA_NUM_CTX:-1536}
OLLAMA_CONTEXT_CHARS=${OLLAMA_CONTEXT_CHARS:-2200}
OLLAMA_FLASH_ATTENTION=${OLLAMA_FLASH_ATTENTION:-1}
OLLAMA_NUM_BATCH=${OLLAMA_NUM_BATCH:-128}
OLLAMA_NUM_GPU=${OLLAMA_NUM_GPU:-0}
OLLAMA_KV_CACHE_TYPE=${OLLAMA_KV_CACHE_TYPE:-q8_0}
SSID=${SSID}
WIFI_PASSPHRASE=${WIFI_PASSPHRASE}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
PORTAL_DOMAIN=${PORTAL_DOMAIN}
LAN_IP=${LAN_IP}
LAN_PREFIX=${LAN_PREFIX}
DHCP_RANGE_START=${DHCP_RANGE_START}
DHCP_RANGE_END=${DHCP_RANGE_END}
DANILO_EMAIL_DOMAIN=${DANILO_EMAIL_DOMAIN:-${PORTAL_DOMAIN}}
DANILO_STUDENT_EMAIL_DOMAIN=${DANILO_STUDENT_EMAIL_DOMAIN:-student.${PORTAL_DOMAIN}}
DANILO_SEED_DEMO=${DANILO_SEED_DEMO}
FRONTEND_URL=http://${PORTAL_DOMAIN}
API_BASE_URL=/api
CORS_ORIGINS=http://${PORTAL_DOMAIN},http://${LAN_IP}
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
cd "${APP_ROOT}" && docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "\${BACKUP_DIR}/danilo-db-\$(date +%F).sql"
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
