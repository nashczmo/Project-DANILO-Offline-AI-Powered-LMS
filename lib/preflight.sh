# Project DANILO installer module: preflight.sh

command_missing() {
  ! command -v "$1" >/dev/null 2>&1
}

require_command() {
  if command_missing "$1"; then
    echo "Required command is missing: $1"
    echo "Install the base Ubuntu packages or reconnect internet, then re-run this installer."
    exit 1
  fi
}

# -----------------------------------------------------------------------------
# Preflight and dependency installation
# -----------------------------------------------------------------------------

validate_ubuntu_version() {
  if [[ ! -r /etc/os-release ]]; then
    echo "Cannot read /etc/os-release; this installer supports Ubuntu 24.04."
    exit 1
  fi

  . /etc/os-release
  if [[ "${ID:-}" != "ubuntu" || "${VERSION_ID:-}" != "24.04" ]]; then
    echo "Unsupported OS: ${PRETTY_NAME:-unknown}. Project DANILO targets Ubuntu 24.04."
    exit 1
  fi
}

validate_disk_space() {
  local available_kb=0
  local required_kb="${DANILO_MIN_FREE_KB:-31457280}"
  available_kb="$(df -Pk / | awk 'NR == 2 { print $4 }')"
  if (( available_kb < required_kb )); then
    echo "Not enough free disk space under /opt. Need at least $((required_kb / 1024 / 1024)) GB free."
    exit 1
  fi
}

validate_wifi_capability() {
  local iface="$1"
  if [[ -z "${iface}" || ! -d "/sys/class/net/${iface}" ]]; then
    echo "Configured access-point interface is not present: ${iface:-none}"
    exit 1
  fi

  if ! iw list 2>/dev/null | awk '/Supported interface modes:/,/Band [0-9]+:/' | grep -q '\* AP'; then
    echo "No AP-capable Wi-Fi interface was detected. Use DANILO_WIFI_IFACE to select a known AP-capable adapter."
    exit 1
  fi
}

validate_wifi_passphrase() {
  if (( ${#WIFI_PASSPHRASE} < 8 || ${#WIFI_PASSPHRASE} > 63 )); then
    echo "Wi-Fi passphrase must be 8-63 characters. Current length: ${#WIFI_PASSPHRASE}"
    echo "Set DANILO_WIFI_PASSPHRASE to override. Default: ProjectDANILO2026!"
    exit 1
  fi
}

check_internet_reachability() {
  if command_missing curl; then
    note "curl is not installed yet; internet reachability will be rechecked after packages are installed"
    return 0
  fi

  if curl -fsS --connect-timeout 5 https://download.docker.com >/dev/null 2>&1; then
    note "Internet is reachable for package and image refresh"
  else
    note "Internet check failed; continuing and relying on cached packages/images where available"
  fi
}

internet_reachable_now() {
  if command_missing curl; then
    return 1
  fi

  curl -fsS --connect-timeout 5 https://registry.ollama.ai >/dev/null 2>&1 ||
    curl -fsS --connect-timeout 5 https://download.docker.com >/dev/null 2>&1
}

preflight_checks() {
  validate_ubuntu_version
  validate_disk_space
  if [[ ! -d "${LOCAL_LESSONS_DIR}" ]]; then
    note "Local lessons folder not found: ${LOCAL_LESSONS_DIR}"
    note "The portal will start with no lesson content. Use --sync later to add lessons."
  fi
  require_command awk
  require_command sed
  require_command ip
  require_command systemctl
  check_internet_reachability
}

apt_install() {
  run_step_command "Installing apt packages" env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$@"
}

# Base system packages for Docker, Wi-Fi AP control, firewall persistence, and
# resolver management.

prepare_apt() {
  export DEBIAN_FRONTEND=noninteractive
  if ! run_step_command "Refreshing apt package lists" apt-get update -y -qq; then
    warn "apt update failed; attempting install from the local package cache"
  fi
  apt_install apt-transport-https ca-certificates curl gnupg software-properties-common \
    lsb-release jq unzip git build-essential rfkill iw net-tools avahi-daemon \
    network-manager hostapd dnsmasq iptables-persistent netfilter-persistent \
    python3.12 python3.12-venv python3-pip openssl e2fsprogs psmisc logrotate rsync
}

