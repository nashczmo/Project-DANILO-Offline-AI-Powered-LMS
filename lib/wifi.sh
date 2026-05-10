# Project DANILO installer module: wifi.sh

list_wifi_interfaces() {
  iw dev 2>/dev/null | awk '$1 == "Interface" { print $2 }'
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
      fail "Unable to detect a Wi-Fi interface for the DANILO access point."
      echo ""
      echo "Troubleshooting:"
      echo "  1. Ensure a USB Wi-Fi adapter is plugged in"
      echo "  2. Run 'lsusb' to confirm it is recognized"
      echo "  3. Run 'iw dev' to list Wi-Fi interfaces"
      echo "  4. Override manually: DANILO_WIFI_IFACE=wlan0 sudo bash danilo.sh --install"
      exit 1
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

  detect_wifi_roles

  mkdir -p "${RUNTIME_ROOT}"
  validate_wifi_capability "${AP_WIFI_IFACE}"
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

configure_access_point() {
  write_network_scripts
  write_systemd_units
}

