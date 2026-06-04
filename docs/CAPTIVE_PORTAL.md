# Captive Portal Guide

Project DANILO includes built-in support for broadcasting a local WiFi network and serving a captive portal, allowing mobile devices (students/teachers) to easily connect without an external internet connection.

## WiFi SSID Behavior
If a compatible WiFi adapter (supporting AP mode) is detected on the Ubuntu host, the installer configures `hostapd` and `dnsmasq` to broadcast a local SSID.

## Captive Portal Popup Behavior
When connecting to the WiFi network, mobile devices typically detect the captive portal and automatically open a webview to the LMS. However, this behavior is heavily OS-dependent:
- **Android:** May prompt "Sign in to network". Tapping the notification opens the portal.
- **iOS:** Typically opens a "Log In" screen automatically when joining the network.

## Manual Fallback Access
If the automatic popup is dismissed, users can access the LMS with the offline hostname:
- **Portal Hostname:** `http://danilo.edu`
- **Diagnostic IP URL:** `http://10.10.0.1` (use only to confirm the web server is reachable if DNS is being bypassed)

## Troubleshooting Connections
If users cannot connect or load the captive portal, try the following:
1. **Disable Private DNS:** On Android, "Private DNS" (or Secure DNS) can bypass the local `dnsmasq` DNS intercept. Disable it in Network Settings.
2. **Disable VPNs:** Active VPN apps route traffic away from the local LMS. They must be paused or disabled.
3. **Forget and Rejoin WiFi:** Instruct the user to "Forget" the network in their WiFi settings and reconnect to re-trigger the portal detection.
4. **Use Hostname URL:** Open a standard browser (Chrome, Safari, etc.) and explicitly type `http://danilo.edu`; use `http://10.10.0.1` only to isolate DNS issues.
5. **Check AP Service Status:** On the server host, run: `sudo systemctl status danilo-ap.service`
6. **Verify System Health:** Run the master verification script: `sudo bash danilo.sh --verify`
