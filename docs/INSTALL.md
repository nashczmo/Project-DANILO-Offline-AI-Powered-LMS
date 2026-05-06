# Project DANILO Install Guide

Target OS: Ubuntu 24.04 LTS.

From the copied `danilo-installer` folder:

```bash
sudo bash danilo.sh --clean-install
```

Supported commands:

```bash
sudo bash danilo.sh --install
sudo bash danilo.sh --clean-install
sudo bash danilo.sh --update
sudo bash danilo.sh --rebuild-frontend
sudo bash danilo.sh --sync
sudo bash danilo.sh --verify
sudo bash danilo.sh --uninstall
sudo bash danilo.sh --help
```

The installer checks sudo/root, Ubuntu 24.04, free disk space, base packages, Docker, Node.js, Python runtime packages, backend files, frontend files, PostgreSQL, Ollama, Wi-Fi/AP services, systemd units, nginx gateway, logs, backups, and rollback.

Generated runtime structure:

```text
/opt/danilo/app/backend      FastAPI LMS API
/opt/danilo/app/frontend     React/Vite LMS UI
/opt/danilo/app/gateway      Nginx Dockerfile
/opt/danilo/app/infra/nginx  Captive portal and API proxy config
/opt/danilo/app/.env         local secrets and runtime settings
```

Repository structure:

```text
danilo.sh
lib/
models/
docs/
scripts/
```

The installer uses one frontend source of truth: `lib/frontend.sh`. It generates `/opt/danilo/app/frontend` during install, update, and frontend rebuild. There is no separate `templates/frontend` app.

Logs and backups:

```bash
/var/log/danilo-install.log
/var/backups/danilo
```

Default administrator:

```text
username: admin
password: ProjectDANILO2026!
```

After install:

```bash
sudo bash danilo.sh --verify
```

Portal:

```text
http://danilo.local
```

To reset data and reinstall:

```bash
sudo bash danilo.sh --clean-install
```

To seed demo LMS data for smoke testing:

```bash
sudo DANILO_SEED_DEMO=1 bash danilo.sh --install
```

Before copying from Windows, you can run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
```

If shell scripts were edited on Windows, normalize them before copying to Ubuntu:

```powershell
Get-ChildItem -File *.sh,lib\*.sh | ForEach-Object {
  $text = Get-Content -LiteralPath $_.FullName -Raw
  $text = $text -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($_.FullName, $text, [System.Text.UTF8Encoding]::new($false))
}
```

On Ubuntu, confirm syntax and executable bits:

```bash
chmod +x danilo.sh lib/*.sh
for f in danilo.sh lib/*.sh; do bash -n "$f"; done
```
