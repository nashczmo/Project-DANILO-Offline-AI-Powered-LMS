# Project DANILO installer module: common.sh

STACK_NAME="danilo"
export COMPOSE_PROJECT_NAME="${STACK_NAME}"
SCRIPT_DIR="${DANILO_INSTALLER_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
PROJECT_ROOT="/opt/danilo"
APP_ROOT="${PROJECT_ROOT}/app"
RUNTIME_ROOT="${PROJECT_ROOT}/runtime"
CONTENT_ROOT="${APP_ROOT}/content"
LOCAL_LESSONS_DIR="${SCRIPT_DIR}/lessons"
CREDENTIALS_FILE="${RUNTIME_ROOT}/admin-credentials.txt"
LOG_FILE="/var/log/danilo-install.log"
BACKUP_ROOT="/var/backups/danilo"

LAN_IP="${DANILO_LAN_IP:-10.10.0.1}"
LAN_PREFIX="${DANILO_LAN_PREFIX:-24}"
PORTAL_DOMAIN="${DANILO_PORTAL_DOMAIN:-danilo.local}"
SSID="${DANILO_SSID:-PROJECT-DANILO}"
WIFI_PASSPHRASE="${DANILO_WIFI_PASSPHRASE:-ProjectDANILO2026!}"
DANILO_AI_RUNTIME="ollama"
OLLAMA_MODEL="${DANILO_OLLAMA_MODEL:-phi4-mini}"
DANILO_SEED_DEMO="${DANILO_SEED_DEMO:-0}"
POSTGRES_DB="${DANILO_POSTGRES_DB:-danilo}"
POSTGRES_USER="${DANILO_POSTGRES_USER:-danilo}"
POSTGRES_PASSWORD="${DANILO_POSTGRES_PASSWORD:-}"
DATABASE_URL="${DANILO_DATABASE_URL:-}"
JWT_SECRET="${DANILO_JWT_SECRET:-}"
ADMIN_USERNAME="${DANILO_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${DANILO_ADMIN_PASSWORD:-}"
NODE_MAJOR="${DANILO_NODE_MAJOR:-22}"
TEMP_OLLAMA_CONTAINER="danilo-ollama-prepull"
SYNC_ONLY=0
CLEAN_BUILD=0
RESET_DATA="${DANILO_RESET_DATA:-0}"
INSTALL_SUCCEEDED=0
RESOLVER_PUBLIC_FALLBACK_USED=0
BOLD="$(printf '\033[1m')"
RESET="$(printf '\033[0m')"
DIM="$(printf '\033[2m')"
BLUE="$(printf '\033[34m')"
GREEN="$(printf '\033[32m')"
YELLOW="$(printf '\033[33m')"
RED="$(printf '\033[31m')"
CYAN="$(printf '\033[36m')"

INSTALL_STARTED_AT="$(date +%s)"
CURRENT_STEP_INDEX=0
CURRENT_STEP_TOTAL=0
CURRENT_STEP_LABEL="Starting"
LAST_RUN_DESCRIPTION=""
LAST_RUN_COMMAND=""
LAST_FAILED_DESCRIPTION=""
LAST_FAILED_COMMAND=""

secure_project_root() {
  if [[ -d "${PROJECT_ROOT}" ]]; then
    chown -R root:root "${PROJECT_ROOT}"
    chmod 0755 "${PROJECT_ROOT}"
  fi

  if [[ -d "${APP_ROOT}" ]]; then
    find "${APP_ROOT}" -type d -exec chmod 0755 {} +
    find "${APP_ROOT}" -type f ! -name .env -exec chmod 0644 {} +
  fi

  if [[ -f "${APP_ROOT}/.env" ]]; then
    chown root:root "${APP_ROOT}/.env"
    chmod 0600 "${APP_ROOT}/.env"
  fi

  if [[ -d "${RUNTIME_ROOT}" ]]; then
    chown root:root "${RUNTIME_ROOT}"
    chmod 0700 "${RUNTIME_ROOT}"
  fi

  if [[ -f "${CREDENTIALS_FILE}" ]]; then
    chown root:root "${CREDENTIALS_FILE}"
    chmod 0600 "${CREDENTIALS_FILE}"
  fi

  if [[ -d "${CONTENT_ROOT}" ]]; then
    chmod -R a+rX "${CONTENT_ROOT}"
  fi
}

DANILO_MANAGED_FILES=(
  /etc/apt/sources.list.d/docker.list
  /etc/apt/sources.list.d/nodesource.list
  /etc/default/hostapd
  /etc/dnsmasq.conf
  /etc/dnsmasq.d/danilo.conf
  /etc/hostapd/danilo.conf
  /etc/logrotate.d/danilo-install
  /etc/NetworkManager/conf.d/99-danilo.conf
  /etc/resolv.conf
  /etc/sysctl.d/98-danilo-ipforward.conf
  /etc/systemd/resolved.conf.d/no-stub.conf
  /etc/systemd/system/danilo-ap.service
  /etc/systemd/system/danilo-stack.service
  /usr/local/bin/danilo-network-down.sh
  /usr/local/bin/danilo-network-up.sh
)

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  LOG_FILE="${TMPDIR:-/tmp}/danilo-install.log"
fi
umask 077
INSTALL_MODE="install"
VERIFY_FAILED=0

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "This installer must be run as root or with sudo."
    exit 1
  fi
}
