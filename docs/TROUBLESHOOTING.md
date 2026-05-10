# Project DANILO Troubleshooting

Run the verifier first:

```bash
sudo bash danilo.sh --verify
```

Installer log:

```bash
sudo tail -n 200 /var/log/danilo-install.log
```

Docker stack:

```bash
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120
```

Services:

```bash
sudo systemctl status danilo-stack.service danilo-ap.service dnsmasq.service hostapd.service --no-pager
```

Common fixes:

- Unsupported OS: install on Ubuntu 24.04 LTS.
- Low disk space: free at least 30 GB before install.
- Docker unavailable: reconnect internet and rerun `sudo bash danilo.sh --install`.
- Portal refresh 404: rerun `sudo bash danilo.sh --rebuild-frontend`; the nginx gateway serves SPA fallback routes.
- Ollama offline: check `sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 ollama`.
- Model missing: place a `.gguf` file in `models/`, then run `sudo bash danilo.sh --update`.
- Admin login failure: rerun `sudo bash danilo.sh --update`; backend startup repairs the configured admin account without changing the required credentials.
- Teacher upload failure: verify the file is under the upload limit and is `.pdf`, `.ppt`, `.pptx`, `.docx`, or `.txt`; then check backend logs.
- Stale UI after update: run `sudo bash danilo.sh --rebuild-frontend`. The frontend is generated from `lib/frontend.sh`.
- Shell syntax errors after copying from Windows: convert scripts to UTF-8 without BOM and LF line endings, then run `chmod +x danilo.sh lib/*.sh` and `for f in danilo.sh lib/*.sh; do bash -n "$f"; done`.
- Verifier failures: run `sudo bash danilo.sh --verify`, then check the named failed check in `/var/log/danilo-install.log` and Docker logs.

Normalize line endings on Windows:

```powershell
Get-ChildItem -File *.sh,lib\*.sh | ForEach-Object {
  $text = Get-Content -LiteralPath $_.FullName -Raw
  $text = $text -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($_.FullName, $text, [System.Text.UTF8Encoding]::new($false))
}
```

Reset/reinstall:

```bash
sudo bash danilo.sh --clean-install
```

Uninstall generated services and app files:

```bash
sudo bash danilo.sh --uninstall
```
