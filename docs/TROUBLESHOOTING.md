# Troubleshooting Guide

If you encounter issues during or after the installation of Project DANILO, consult the common scenarios and exact diagnostic commands below.

## How to Collect Logs

Before diving into specific issues, knowing how to collect logs is essential.

**Master Installer Log:**
```bash
sudo tail -n 200 /var/log/danilo-install.log
```

**Overall Docker Compose Status:**
```bash
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps
```

**All Service Logs:**
```bash
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120
```

**Systemd Stack Status:**
```bash
sudo systemctl status danilo-stack.service --no-pager
```

## Common Scenarios

### Backend Healthcheck Unhealthy or Startup Failure
If the installer fails with "Backend healthcheck reported unhealthy for service: backend", or `/api/health` is unavailable:
1. Inspect the backend logs directly:
   ```bash
   sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 backend
   ```
2. Verify that PostgreSQL is healthy. The backend will deliberately wait for the `db` service to report a healthy state before launching FastAPI.
   ```bash
   sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 db
   ```

### Docker Not Installed or Daemon Not Running
If the preflight or installation scripts complain about Docker:
1. The installer attempts to install Docker Engine automatically. If it failed, check the apt logs in `/var/log/danilo-install.log`.
2. Verify the daemon status manually:
   ```bash
   sudo systemctl status docker --no-pager
   ```

### Gateway/Frontend Unavailable or Build Failure
If you cannot reach `http://localhost` or `http://danilo.local`:
1. Check the Nginx gateway logs for proxy configuration errors or port conflicts:
   ```bash
   sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 gateway
   ```
2. If the Vite frontend build failed during installation (often due to missing Node/npm dependencies or RAM constraints during `npm run build`), you can rebuild it:
   ```bash
   sudo bash danilo.sh --rebuild-frontend
   ```

### Node/npm Issues
The installer requires Node 20+ to compile the frontend. If the OS repositories fail to provide this, the installer automatically adds the NodeSource repository. If you still encounter Node errors, verify your host versions:
```bash
node --version
npm --version
```

### Ollama/Model Unavailable or No Internet
The core LMS is decoupled from the AI features. If the installer cannot reach the internet to download the Ollama model:
1. The `--verify` command will report the AI status as `[WARN] Degraded`.
2. The core LMS (Admin/Student/Teacher portals) will **still work**.
3. To resolve the degraded status, connect the machine to the internet and run:
   ```bash
   sudo bash danilo.sh --update
   ```

### Wi-Fi AP / Captive Portal Unavailable
If the Wi-Fi AP does not broadcast the "Project DANILO" SSID:
1. The host machine may lack compatible Wi-Fi hardware, or `hostapd` failed to initialize.
2. The installer gracefully falls back to **Local-Only mode**. You can access the LMS via `http://localhost`.
3. To inspect the AP logs:
   ```bash
   sudo systemctl status danilo-ap.service --no-pager
   ```

### Port Conflicts & DNS Issues
If you have conflicting web servers (port 80/443) or DNS resolvers (port 53, like `systemd-resolved` blocking `dnsmasq`):
1. The installer's `deep_clean` step attempts to stop conflicting services automatically.
2. If issues persist, verify port 80 and 53 usage:
   ```bash
   sudo lsof -i :80
   sudo lsof -i :53
   ```

### Admin Login Failure
If you cannot log in:
1. Project DANILO generates a random password. It is NOT `ProjectDANILO2026!`.
2. Check the generated credentials file:
   ```bash
   sudo cat /opt/danilo/danilo-credentials.txt
   ```

### Permission Issues or Windows Line-Ending Issues
If you downloaded the repository on a Windows machine and copied it to Ubuntu, Windows `\r\n` (CRLF) line endings might corrupt the bash scripts.
1. The repository `.gitattributes` enforces `lf` for shell scripts.
2. If you manually edited files on Windows, run `dos2unix` on the `danilo.sh` script:
   ```bash
   sudo apt-get install -y dos2unix
   find . -type f -name "*.sh" -exec dos2unix {} +
   ```

## Master Verification Command
Once you believe you have resolved an issue, run the master verification script to confirm:
```bash
sudo bash danilo.sh --verify
```
