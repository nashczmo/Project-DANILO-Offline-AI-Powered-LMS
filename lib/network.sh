# Project DANILO installer module: network.sh

clear_port_53_and_restore_upstream_dns() {
  local resolv_backup=""

  note "Disabling the systemd-resolved stub listener on port 53"
  mkdir -p /etc/systemd/resolved.conf.d
  backup_managed_file /etc/systemd/resolved.conf.d/no-stub.conf
  backup_managed_file /etc/resolv.conf
  resolv_backup="$(backup_path_for /etc/resolv.conf)"

  cat >/etc/systemd/resolved.conf.d/no-stub.conf <<'EOF'
[Resolve]
DNSStubListener=no
EOF

  run_step_command "Restarting systemd-resolved without the stub listener" systemctl restart systemd-resolved
  chattr -i /etc/resolv.conf >/dev/null 2>&1 || true

  if resolver_file_has_upstream "${resolv_backup}"; then
    note "Restoring previously configured upstream DNS resolver"
    cp -a --remove-destination "${resolv_backup}" /etc/resolv.conf
  elif resolver_file_has_upstream /run/systemd/resolve/resolv.conf; then
    note "Using systemd-resolved upstream resolver file"
    ln -sfn /run/systemd/resolve/resolv.conf /etc/resolv.conf
  elif resolver_file_has_upstream /etc/resolv.conf; then
    note "Keeping existing usable resolver file"
  else
    note "No usable local resolver found; using public DNS as a temporary install fallback"
    printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
    RESOLVER_PUBLIC_FALLBACK_USED=1
  fi
}

restore_preferred_resolver_if_possible() {
  local resolv_backup=""
  resolv_backup="$(backup_path_for /etc/resolv.conf)"

  if resolver_file_has_upstream "${resolv_backup}"; then
    note "Restoring the original upstream DNS resolver"
    cp -a --remove-destination "${resolv_backup}" /etc/resolv.conf
    RESOLVER_PUBLIC_FALLBACK_USED=0
    return 0
  fi

  if resolver_file_has_upstream /run/systemd/resolve/resolv.conf; then
    note "Switching back to the system resolver upstream file"
    ln -sfn /run/systemd/resolve/resolv.conf /etc/resolv.conf
    RESOLVER_PUBLIC_FALLBACK_USED=0
    return 0
  fi

  return 1
}

# Detect the Beelink dual-radio layout without breaking internet access during
# install. The external USB Archer becomes the AP, while the internal PCI card
# stays online for the pre-pull phase and is only suppressed once the captive
# portal comes up.

reset_dnsmasq_master_config() {
  note "Preparing dnsmasq for DANILO captive DNS"
  backup_managed_file /etc/dnsmasq.conf
  if [[ -f /etc/dnsmasq.conf ]] && grep -q '^conf-dir=/etc/dnsmasq.d/,\*.conf' /etc/dnsmasq.conf; then
    :
  else
    echo "conf-dir=/etc/dnsmasq.d/,*.conf" > /etc/dnsmasq.conf
  fi
  backup_managed_file /etc/dnsmasq.d/danilo.conf
  rm -f /etc/dnsmasq.d/danilo.conf
}

write_network_scripts() {
  reset_dnsmasq_master_config

  backup_managed_file /etc/NetworkManager/conf.d/99-danilo.conf
  cat > /etc/NetworkManager/conf.d/99-danilo.conf <<EOF
[device-danilo-unmanaged]
match-device=mac:${WIFI_MAC}
managed=0
EOF
  systemctl restart NetworkManager >/dev/null 2>&1 || true

  mkdir -p /etc/dnsmasq.d /etc/hostapd
  backup_managed_file /etc/dnsmasq.d/danilo.conf
  cat > /etc/dnsmasq.d/danilo.conf <<EOF
interface=${WIFI_IFACE}
bind-dynamic
listen-address=${LAN_IP}
domain-needed
bogus-priv
dhcp-range=10.10.0.10,10.10.0.200,255.255.255.0,12h
dhcp-option=3,${LAN_IP}
dhcp-option=6,${LAN_IP}
dhcp-option=114,"http://${PORTAL_DOMAIN}/"
address=/#/${LAN_IP}
address=/${PORTAL_DOMAIN}/${LAN_IP}
address=/connectivitycheck.gstatic.com/${LAN_IP}
address=/clients3.google.com/${LAN_IP}
log-queries
log-dhcp
EOF

  backup_managed_file /etc/hostapd/danilo.conf
  cat > /etc/hostapd/danilo.conf <<EOF
country_code=PH
interface=${WIFI_IFACE}
ssid=${SSID}
hw_mode=g
channel=6
ieee80211n=1
wmm_enabled=1
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${WIFI_PASSPHRASE}
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

  backup_managed_file /etc/default/hostapd
  cat >/etc/default/hostapd <<'EOF'
DAEMON_CONF="/etc/hostapd/danilo.conf"
EOF

  backup_managed_file /etc/sysctl.d/98-danilo-ipforward.conf
  cat >/etc/sysctl.d/98-danilo-ipforward.conf <<'EOF'
net.ipv4.ip_forward=1
EOF

  backup_managed_file /usr/local/bin/danilo-network-up.sh
  cat > /usr/local/bin/danilo-network-up.sh <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail

WIFI_IFACE="\$(cat "${RUNTIME_ROOT}/wifi_iface")"
UPLINK_WIFI_IFACE="\$(cat "${RUNTIME_ROOT}/internal_wifi_iface" 2>/dev/null || true)"
LAN_IP="${LAN_IP}"
LAN_PREFIX="${LAN_PREFIX}"

rfkill unblock wifi || true
nmcli radio wifi on >/dev/null 2>&1 || true
systemctl restart NetworkManager
sleep 2

systemctl stop dnsmasq >/dev/null 2>&1 || true

if [[ -n "\${UPLINK_WIFI_IFACE}" ]]; then
  ip link set dev "\${UPLINK_WIFI_IFACE}" down >/dev/null 2>&1 || true
fi

nmcli dev set "\${WIFI_IFACE}" managed no >/dev/null 2>&1 || true
ip link set "\${WIFI_IFACE}" down || true
ip addr flush dev "\${WIFI_IFACE}" || true
ip link set "\${WIFI_IFACE}" up
ip addr add "\${LAN_IP}/\${LAN_PREFIX}" dev "\${WIFI_IFACE}"

# Realtek rtw88 adapters are slow to settle into AP mode. Give the USB Archer
# a full 10 seconds before hostapd and dnsmasq start serving clients.
sleep 10

sysctl --system >/dev/null 2>&1

iptables -t nat -C PREROUTING -i "\${WIFI_IFACE}" -p udp --dport 53 -j REDIRECT --to-ports 53 >/dev/null 2>&1 || \
  iptables -t nat -A PREROUTING -i "\${WIFI_IFACE}" -p udp --dport 53 -j REDIRECT --to-ports 53
iptables -t nat -C PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 53 -j REDIRECT --to-ports 53 >/dev/null 2>&1 || \
  iptables -t nat -A PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 53 -j REDIRECT --to-ports 53
iptables -t nat -C PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 80 -j REDIRECT --to-ports 80 >/dev/null 2>&1 || \
  iptables -t nat -A PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 80 -j REDIRECT --to-ports 80
iptables -C INPUT -i "\${WIFI_IFACE}" -p udp -m multiport --dports 53,67,68 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A INPUT -i "\${WIFI_IFACE}" -p udp -m multiport --dports 53,67,68 -j ACCEPT
iptables -C OUTPUT -o "\${WIFI_IFACE}" -p udp -m multiport --sports 53,67,68 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A OUTPUT -o "\${WIFI_IFACE}" -p udp -m multiport --sports 53,67,68 -j ACCEPT
iptables -C INPUT -i "\${WIFI_IFACE}" -p tcp --dport 53 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A INPUT -i "\${WIFI_IFACE}" -p tcp --dport 53 -j ACCEPT
iptables -C OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 53 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 53 -j ACCEPT
iptables -C INPUT -i "\${WIFI_IFACE}" -p tcp --dport 80 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A INPUT -i "\${WIFI_IFACE}" -p tcp --dport 80 -j ACCEPT
iptables -C OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 80 -j ACCEPT >/dev/null 2>&1 || \
  iptables -A OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 80 -j ACCEPT

netfilter-persistent save >/dev/null 2>&1 || true

systemctl restart dnsmasq
systemctl restart hostapd
EOF
  chmod +x /usr/local/bin/danilo-network-up.sh

  backup_managed_file /usr/local/bin/danilo-network-down.sh
  cat > /usr/local/bin/danilo-network-down.sh <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail

WIFI_IFACE="\$(cat "${RUNTIME_ROOT}/wifi_iface")"
UPLINK_WIFI_IFACE="\$(cat "${RUNTIME_ROOT}/internal_wifi_iface" 2>/dev/null || true)"

systemctl stop hostapd >/dev/null 2>&1 || true
systemctl stop dnsmasq >/dev/null 2>&1 || true

iptables -t nat -D PREROUTING -i "\${WIFI_IFACE}" -p udp --dport 53 -j REDIRECT --to-ports 53 >/dev/null 2>&1 || true
iptables -t nat -D PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 53 -j REDIRECT --to-ports 53 >/dev/null 2>&1 || true
iptables -t nat -D PREROUTING -i "\${WIFI_IFACE}" -p tcp --dport 80 -j REDIRECT --to-ports 80 >/dev/null 2>&1 || true
iptables -D INPUT -i "\${WIFI_IFACE}" -p udp -m multiport --dports 53,67,68 -j ACCEPT >/dev/null 2>&1 || true
iptables -D OUTPUT -o "\${WIFI_IFACE}" -p udp -m multiport --sports 53,67,68 -j ACCEPT >/dev/null 2>&1 || true
iptables -D INPUT -i "\${WIFI_IFACE}" -p tcp --dport 53 -j ACCEPT >/dev/null 2>&1 || true
iptables -D OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 53 -j ACCEPT >/dev/null 2>&1 || true
iptables -D INPUT -i "\${WIFI_IFACE}" -p tcp --dport 80 -j ACCEPT >/dev/null 2>&1 || true
iptables -D OUTPUT -o "\${WIFI_IFACE}" -p tcp --sport 80 -j ACCEPT >/dev/null 2>&1 || true

ip addr flush dev "\${WIFI_IFACE}" >/dev/null 2>&1 || true
ip link set "\${WIFI_IFACE}" down >/dev/null 2>&1 || true
nmcli dev set "\${WIFI_IFACE}" managed yes >/dev/null 2>&1 || true
if [[ -n "\${UPLINK_WIFI_IFACE}" ]]; then
  ip link set dev "\${UPLINK_WIFI_IFACE}" up >/dev/null 2>&1 || true
fi
systemctl restart NetworkManager >/dev/null 2>&1 || true
EOF
  chmod +x /usr/local/bin/danilo-network-down.sh
}

get_container_ip() {
  local service="$1"
  local container_id=""

  container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
  [[ -n "${container_id}" ]] || return 1
  docker inspect --format '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${container_id}" 2>/dev/null
}

