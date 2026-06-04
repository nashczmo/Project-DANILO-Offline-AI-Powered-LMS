# Troubleshooting Guide

If you encounter issues during or after the installation of Project DANILO, consult the common scenarios and diagnostic commands below.

## How to Collect Logs
- **Master Installer Log:** `sudo tail -n 200 /var/log/danilo-install.log`
- **Compose Status:** `sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps`
- **All Service Logs:** `sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120`
- **Systemd Stack Status:** `sudo systemctl status danilo-stack.service --no-pager`

## Master Verification Command
Once you believe you have resolved an issue, run the master verification script to confirm system health:
```bash
sudo bash danilo.sh --verify
```

## Captive Portal / WiFi Issues

If the Captive Portal is not behaving as expected:
1. **SSID Does Not Appear:** Check if the access point service is running:
   ```bash
   sudo systemctl status danilo-ap.service
   ```
   If it failed, your WiFi hardware may not support AP mode. The system gracefully falls back to local network mode.
2. **No Popup / Cannot Connect:** Captive portal popups depend heavily on Android/iOS OS-level behavior. 
   - Try disabling "Private DNS" in Android settings.
   - Disable any active VPNs.
   - Forget the WiFi network and rejoin.
   - **Hostname URL:** Open a browser and explicitly visit `http://danilo.edu`; use `http://10.10.0.1` only to isolate DNS issues.

## AI / Ollama Issues

If the AI features are unavailable:
- Check the verification script. It might report `[WARN] Degraded`.
- **Offline Resilience:** The core LMS is fully decoupled from the AI systems. If the AI model fails to load or download, the Admin, Student, and Teacher portals will **still function normally**.
- **Performance:** Local AI performance depends entirely on hardware. If generation is slow, ensure you have sufficient RAM.

## Backend Startup Failure
If `/api/health` is unavailable:
- Check if PostgreSQL is healthy. The backend waits for the database to be ready.
- Check backend logs directly: `sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 backend`

## Docker / Node Issues
- If Docker daemon fails, verify status: `sudo systemctl status docker --no-pager`
- If frontend fails to build during install, try: `sudo bash danilo.sh --rebuild-frontend`

## Port Conflicts & DNS Issues
If you have conflicting web servers (port 80) or DNS resolvers (port 53):
- The installer's `deep_clean` step attempts to stop conflicting services automatically.
- Verify usage manually: `sudo lsof -i :80` and `sudo lsof -i :53`

## Admin Login Failure
- The password is cryptographically generated on install. 
- Check the credentials file: `sudo cat /opt/danilo/danilo-credentials.txt`
