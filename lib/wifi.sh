# Project DANILO installer module: wifi.sh

list_wifi_interfaces() {
  local iface=""
  local seen=()
  
  while read -r iface; do
    if [[ -n "${iface}" ]]; then
      echo "${iface}"
      seen+=("${iface}")
    fi
  done < <(iw dev 2>/dev/null | awk '$1 == "Interface" { print $2 }')

  for dev_dir in /sys/class/net/*; do
    [[ -e "${dev_dir}" ]] || continue
    iface="$(basename "${dev_dir}")"
    [[ "${iface}" == "lo" ]] && continue
    
    local already_seen=0
    for s in "${seen[@]}"; do
      if [[ "${s}" == "${iface}" ]]; then
        already_seen=1
        break
      fi
    done
    [[ "${already_seen}" -eq 1 ]] && continue

    if [[ -d "${dev_dir}/wireless" ]] || [[ -d "${dev_dir}/phy80211" ]]; then
      echo "${iface}"
      seen+=("${iface}")
    fi
  done
}

interface_bus_type() {
  local iface="$1"
  local device_path=""
  device_path="$(readlink -f "/sys/class/net/${iface}/device" 2>/dev/null || true)"

  if [[ "${device_path}" == *"/usb"* ]]; then
    printf 'usb\n'
    return 0
  fi

  if [[ "${device_path}" == *"/pci"* ]]; then
    printf 'pci\n'
    return 0
  fi

  printf 'unknown\n'
}

get_interface_mac() {
  local iface="$1"
  cat "/sys/class/net/${iface}/address" 2>/dev/null | tr '[:upper:]' '[:lower:]'
}

detect_internal_wifi_interface() {
  local primary_iface="$1"
  local candidate=""
  local device_path=""

  while read -r candidate; do
    [[ -z "${candidate}" || "${candidate}" == "${primary_iface}" ]] && continue
    device_path="$(readlink -f "/sys/class/net/${candidate}/device" 2>/dev/null || true)"
    if [[ "${candidate}" =~ ^wlp ]] || [[ "${device_path}" == *"/pci"* ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done < <(iw dev 2>/dev/null | awk '$1 == "Interface" { print $2 }')

  while read -r candidate; do
    [[ -z "${candidate}" || "${candidate}" == "${primary_iface}" ]] && continue
    printf '%s\n' "${candidate}"
    return 0
  done < <(iw dev 2>/dev/null | awk '$1 == "Interface" { print $2 }')

  return 1
}

detect_wifi_roles() {
  local iface=""
  local bus=""
  local first_wifi=""

  AP_WIFI_IFACE="${WIFI_IFACE:-}"
  AP_WIFI_IFACE="${DANILO_WIFI_IFACE:-${AP_WIFI_IFACE}}"
  UPLINK_WIFI_IFACE="${INTERNAL_WIFI_IFACE:-}"
  UPLINK_WIFI_IFACE="${DANILO_INTERNAL_WIFI_IFACE:-${UPLINK_WIFI_IFACE}}"

  while read -r iface; do
    [[ -z "${iface}" ]] && continue
    [[ -z "${first_wifi}" ]] && first_wifi="${iface}"
    bus="$(interface_bus_type "${iface}")"

    if [[ -z "${AP_WIFI_IFACE}" ]]; then
      if [[ "${iface}" =~ ^wlx ]] || [[ "${bus}" == "usb" ]]; then
        AP_WIFI_IFACE="${iface}"
      fi
    fi

    if [[ -z "${UPLINK_WIFI_IFACE}" ]]; then
      if [[ "${iface}" != "${AP_WIFI_IFACE}" ]] && { [[ "${iface}" =~ ^wlp ]] || [[ "${bus}" == "pci" ]]; }; then
        UPLINK_WIFI_IFACE="${iface}"
      fi
    fi
  done < <(list_wifi_interfaces)

  if [[ -z "${AP_WIFI_IFACE}" ]]; then
    AP_WIFI_IFACE="${first_wifi:-}"
  fi

  if [[ -z "${UPLINK_WIFI_IFACE}" ]]; then
    while read -r iface; do
      [[ -z "${iface}" || "${iface}" == "${AP_WIFI_IFACE}" ]] && continue
      UPLINK_WIFI_IFACE="${iface}"
      break
    done < <(list_wifi_interfaces)
  fi

  if [[ -z "${AP_WIFI_IFACE}" ]]; then
    warn "No Wi-Fi interface detected on first attempt. Retrying after 5 seconds..."
    sleep 5
    detect_wifi_roles_inner
    if [[ -z "${AP_WIFI_IFACE}" ]]; then
      warn "Unable to detect any Wi-Fi interface. Falling back to LAPTOP/LOCAL-ONLY mode."
      LAPTOP_LOCAL_MODE=1
      AP_WIFI_IFACE="lo"
    fi
  fi
}

detect_wifi_roles_inner() {
  local iface=""
  local bus=""
  local first_wifi=""

  while read -r iface; do
    [[ -z "${iface}" ]] && continue
    [[ -z "${first_wifi}" ]] && first_wifi="${iface}"
    bus="$(interface_bus_type "${iface}")"
    if [[ -z "${AP_WIFI_IFACE}" ]]; then
      if [[ "${iface}" =~ ^wlx ]] || [[ "${bus}" == "usb" ]]; then
        AP_WIFI_IFACE="${iface}"
      fi
    fi
  done < <(list_wifi_interfaces)
  if [[ -z "${AP_WIFI_IFACE}" ]]; then
    AP_WIFI_IFACE="${first_wifi:-}"
  fi
}

prepare_wifi_hardware() {
  note "Releasing wireless hardware for access-point control"
  rfkill unblock wifi || true
  nmcli radio wifi on >/dev/null 2>&1 || true
  run_step_command "Restarting NetworkManager before Wi-Fi detection" systemctl restart NetworkManager
  sleep 4

  # Force a re-scan by resetting LAPTOP_LOCAL_MODE to 0 at the start of the step
  LAPTOP_LOCAL_MODE=0

  detect_wifi_roles

  mkdir -p "${RUNTIME_ROOT}"

  if [[ "${LAPTOP_LOCAL_MODE}" -eq 1 ]]; then
    echo "1" > "${RUNTIME_ROOT}/local_mode"
    echo "lo" > "${RUNTIME_ROOT}/wifi_iface"
    echo "" > "${RUNTIME_ROOT}/internal_wifi_iface"
    echo "00:00:00:00:00:00" > "${RUNTIME_ROOT}/wifi_mac"
    note "Project DANILO is configured in LAPTOP/LOCAL-ONLY mode fallback. AP networking will be bypassed."
    return 0
  fi

  if ! validate_wifi_capability "${AP_WIFI_IFACE}"; then
    warn "Wi-Fi interface '${AP_WIFI_IFACE}' does not support AP mode. Falling back to LAPTOP/LOCAL-ONLY mode."
    LAPTOP_LOCAL_MODE=1
    echo "1" > "${RUNTIME_ROOT}/local_mode"
    echo "lo" > "${RUNTIME_ROOT}/wifi_iface"
    echo "" > "${RUNTIME_ROOT}/internal_wifi_iface"
    echo "00:00:00:00:00:00" > "${RUNTIME_ROOT}/wifi_mac"
    return 0
  fi

  # Successfully validated AP hardware capability! Remove any stale local_mode markers
  rm -f "${RUNTIME_ROOT}/local_mode"

  validate_wifi_passphrase
  WIFI_IFACE="${AP_WIFI_IFACE}"
  echo "${AP_WIFI_IFACE}" > "${RUNTIME_ROOT}/wifi_iface"
  printf '%s\n' "${UPLINK_WIFI_IFACE:-}" > "${RUNTIME_ROOT}/internal_wifi_iface"
  WIFI_MAC="$(get_interface_mac "${AP_WIFI_IFACE}")"
  if [[ -z "${WIFI_MAC}" ]]; then
    echo "Unable to determine the MAC address for ${AP_WIFI_IFACE}."
    exit 1
  fi
  echo "${WIFI_MAC}" > "${RUNTIME_ROOT}/wifi_mac"
  note "Using USB Wi-Fi interface for the DANILO hotspot: ${AP_WIFI_IFACE}"
  note "Using Wi-Fi MAC address: ${WIFI_MAC}"
  if [[ -n "${UPLINK_WIFI_IFACE:-}" ]]; then
    note "Keeping internal Wi-Fi active for internet downloads: ${UPLINK_WIFI_IFACE}"
  else
    note "No separate internal Wi-Fi detected; pre-pull will use the current host connectivity."
  fi
}

# -----------------------------------------------------------------------------
# Runtime configuration and generated application files
# -----------------------------------------------------------------------------

