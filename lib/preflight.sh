# Project DANILO installer module: preflight.sh

command_missing() {
  ! command -v "$1" >/dev/null 2>&1
}

require_command() {
  local cmd="$1"
  local pkg="${2:-$1}"

  if command_missing "${cmd}"; then
    if [[ "${cmd}" == "docker" ]]; then
      if declare -f install_docker >/dev/null; then
        note_status "WAIT" "Required command 'docker' is missing. Attempting self-healing installation..."
        install_docker
        if command_missing docker; then
          fail "Docker could not be auto-installed. Check internet or install manually."
          exit 1
        fi
        return 0
      else
        pkg="docker.io"
      fi
    elif [[ "${cmd}" == "npm" || "${cmd}" == "node" ]]; then
      if declare -f install_node >/dev/null; then
        note_status "WAIT" "Required command '${cmd}' is missing. Attempting self-healing installation..."
        install_node
        if command_missing "${cmd}"; then
          fail "Node.js/npm could not be auto-installed. Check internet or install manually."
          exit 1
        fi
        return 0
      else
        pkg="nodejs"
      fi
    fi

    # Map other standard commands to their packages
    if [[ "${cmd}" == "awk" ]]; then pkg="gawk"; fi
    if [[ "${cmd}" == "ip" ]]; then pkg="iproute2"; fi
    if [[ "${cmd}" == "ss" ]]; then pkg="iproute2"; fi
    if [[ "${cmd}" == "df" ]]; then pkg="coreutils"; fi
    if [[ "${cmd}" == "free" ]]; then pkg="procps"; fi
    if [[ "${cmd}" == "systemctl" ]]; then pkg="systemd"; fi

    note_status "WAIT" "Required command '${cmd}' is missing. Attempting self-healing installation of '${pkg}'..."
    export DEBIAN_FRONTEND=noninteractive
    
    # Ensure apt is updated before trying to self-heal
    if declare -f apt_update_once >/dev/null; then
      apt_update_once
    fi
    
    # Try installing with our new resilient wrapper, which handles locks and broken packages
    if run_resilient_command "Installing ${pkg}" apt-get install -y -qq "${pkg}"; then
      ok "Self-healed missing command '${cmd}'"
      return 0
    else
      fail "Required command is missing and could not be auto-installed: ${cmd} (package: ${pkg})"
      exit 1
    fi
  fi
}

verify_command_available() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Command verification failed: $1 is not available."
    exit 1
  fi
}

# -----------------------------------------------------------------------------
# Preflight and dependency installation
# -----------------------------------------------------------------------------

validate_ubuntu_version() {
  if [[ ! -r /etc/os-release ]]; then
    echo "Cannot read /etc/os-release; this installer supports Ubuntu Linux."
    exit 1
  fi

  . /etc/os-release
  if [[ "${ID:-}" != "ubuntu" ]]; then
    echo "Unsupported OS: ${PRETTY_NAME:-unknown}. Project DANILO targets Ubuntu."
    exit 1
  fi
}

validate_disk_space() {
  local available_kb=0
  local required_kb="${DANILO_MIN_FREE_KB:-31457280}"
  available_kb="$(df -Pk / 2>/dev/null | awk 'NR == 2 { print $4 }' || echo 0)"
  [[ "${available_kb}" =~ ^[0-9]+$ ]] || available_kb=0
  if (( available_kb < required_kb )); then
    warn "Low disk space under /opt. Has $((available_kb / 1024 / 1024)) GB free (Project DANILO recommends at least $((required_kb / 1024 / 1024)) GB for containers and AI models)."
    warn "Proceeding with installation on your hardware anyway."
  else
    note "Disk space check passed: $((available_kb / 1024 / 1024)) GB free"
  fi
}

validate_wifi_capability() {
  local iface="$1"
  if [[ -z "${iface}" || ! -d "/sys/class/net/${iface}" ]]; then
    warn "Configured access-point interface is not present: ${iface:-none}"
    return 1
  fi

  if ! iw list 2>/dev/null | awk '/Supported interface modes:/,/Band [0-9]+:/' | grep -q '\* AP'; then
    warn "No AP-capable Wi-Fi interface was detected."
    return 1
  fi
  return 0
}

validate_wifi_passphrase() {
  if [[ -z "${WIFI_PASSPHRASE:-}" ]]; then
    WIFI_PASSPHRASE="$(openssl rand -base64 18 | tr -d '/+=\r\n' | head -c 20)"
  fi
  if (( ${#WIFI_PASSPHRASE} < 8 || ${#WIFI_PASSPHRASE} > 63 )); then
    echo "Wi-Fi passphrase must be 8-63 characters. Current length: ${#WIFI_PASSPHRASE}"
    echo "Set DANILO_WIFI_PASSPHRASE to override, or let the installer generate one."
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

check_port_conflicts() {
  # Ports used by the DANILO stack: 80 (gateway), 53 (dnsmasq), 67 (hostapd/DHCP)
  local conflicting_ports=()
  local port=0

  for port in 80 53; do
    if command_missing ss; then
      break
    fi
    if ss -tlnp "sport = :${port}" 2>/dev/null | grep -q "LISTEN"; then
      conflicting_ports+=("${port}")
    fi
  done

  if (( ${#conflicting_ports[@]} > 0 )); then
    warn "Port(s) already in use: ${conflicting_ports[*]}"
    warn "DANILO requires ports 80 and 53. Stop conflicting services before installing."
    warn "Common fix: sudo systemctl stop apache2 nginx systemd-resolved"
    # This is a warning, not a fatal error, because the installer reconfigures
    # resolved and nginx will be in the container stack.
  fi
}

validate_docker_available() {
  if command_missing docker; then
    note "Docker is not yet installed; it will be installed during this step"
    return 0
  fi
  if ! docker info >/dev/null 2>&1; then
    warn "Docker is installed but the daemon is not running; will attempt to start it"
    return 0
  fi
  note "Docker daemon is already running"
}

validate_ram_minimum() {
  local required_mb="${DANILO_MIN_RAM_MB:-3072}"
  local available_mb=0

  if command_missing free; then
    note "Cannot check available RAM (free command not found)"
    return 0
  fi

  available_mb="$(free -m | awk '/^Mem:/ { print $2 }')"
  if (( available_mb < required_mb )); then
    warn "System reports only ${available_mb} MB RAM. Project DANILO recommends at least $((required_mb / 1024)) GB."
    warn "The default Q4 educational AI profile needs several GB of free RAM. The portal will attempt to start, but AI may be unstable."
  else
    note "RAM check passed: ${available_mb} MB available (minimum ${required_mb} MB required)"
  fi
}

preflight_checks() {
  validate_ubuntu_version
  validate_disk_space
  validate_ram_minimum
  check_port_conflicts
  validate_docker_available
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
  run_step_command "Installing apt packages" env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -o DPkg::Lock::Timeout=120 "$@"
}

apt_update_once() {
  if [[ "${APT_UPDATED_ONCE:-0}" -eq 1 ]]; then
    return 0
  fi
  local attempts=0
  export DEBIAN_FRONTEND=noninteractive
  while [[ ${attempts} -lt 5 ]]; do
    # Do not kill apt blindly; just wait for locks to be released.
    if run_resilient_command "Refreshing apt package lists" apt-get update -y -qq; then
      export APT_UPDATED_ONCE=1
      return 0
    fi
    attempts=$((attempts + 1))
    warn "apt-get update failed, retrying in 10 seconds to allow locks to release (attempt ${attempts}/5)..."
    sleep 10
  done
  warn "apt-get update failed after multiple attempts; attempting to proceed with cached packages."
}

# Base system packages for Docker, Wi-Fi AP control, firewall persistence, and
# resolver management.

install_base_dependencies() {
  export DEBIAN_FRONTEND=noninteractive
  
  # Fix broken apt lists from previous failed runs
  if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
    rm -f /etc/apt/sources.list.d/docker.list
  fi
  if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
    rm -f /etc/apt/sources.list.d/nodesource.list
  fi

  apt_update_once

  local packages=(
    apt-transport-https ca-certificates curl wget gnupg gpg software-properties-common
    lsb-release jq unzip tar git build-essential pkg-config
    iproute2 iptables iptables-persistent netfilter-persistent net-tools dnsutils network-manager dnsmasq hostapd
    rfkill iw pciutils usbutils lshw e2fsprogs psmisc logrotate rsync openssl avahi-daemon
    python3 python3-venv python3-pip
  )

  if ! run_resilient_command "Installing base OS dependencies" apt-get install -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -o DPkg::Lock::Timeout=120 "${packages[@]}"; then
    fail "Failed to install base dependencies. Please check your internet connection or apt sources."
    exit 1
  fi
  
  # Verify critical base commands installed correctly
  for cmd in curl wget jq unzip tar git awk sed grep python3 ip; do
    verify_command_available "${cmd}"
  done
}
