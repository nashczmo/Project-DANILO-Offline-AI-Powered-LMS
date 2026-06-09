# Network Access Guide

Project DANILO includes built-in support for broadcasting a local WiFi network, allowing mobile devices (students/teachers) to connect without an external internet connection. 

*Note: The automatic Captive Portal hijacking behavior has been explicitly disabled to improve compatibility and reduce unwanted OS popups.*

## WiFi SSID Behavior
If a compatible WiFi adapter (supporting AP mode) is detected on the Ubuntu host, the installer configures `hostapd` and `dnsmasq` to broadcast a local SSID.

## Manual Access (No Captive Portal)
Users must manually open the portal in their web browser after joining the WiFi network:
- **Portal Hostname:** `http://danilo.apc.edu.ph`
- **Diagnostic IP URL:** `http://10.10.0.1` (use only to confirm the web server is reachable if DNS is failing)

## Troubleshooting Connections
If users cannot connect or load the LMS, try the following:
1. **Disable Private DNS:** On Android, "Private DNS" (or Secure DNS) can bypass the local `dnsmasq` DNS. Disable it in Network Settings.
2. **Disable VPNs:** Active VPN apps route traffic away from the local LMS. They must be paused or disabled.
3. **Use Hostname URL:** Open a standard browser (Chrome, Safari, etc.) and explicitly type `http://danilo.apc.edu.ph`; use `http://10.10.0.1` only to isolate DNS issues.
4. **Check AP Service Status:** On the server host, run: `sudo systemctl status danilo-ap.service`
5. **Verify System Health:** Run the master verification script: `sudo bash danilo.sh --verify`
