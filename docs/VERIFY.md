# Project DANILO Verification Guide

Run verification after every install, clean install, update, frontend rebuild, and reboot.

```bash
sudo bash danilo.sh --verify
```

The deployment verifier checks:

- Docker daemon and Docker Compose project
- `postgres`, `backend`, `ollama`, and `gateway` containers
- Backend `/api/health`
- Frontend gateway
- PostgreSQL readiness
- Ollama reachability and active model loading
- `danilo.local` name resolution
- Admin login using `admin` / `ProjectDANILO2026!`

Repository-side preflight before copying to Ubuntu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
```

The verifier checks:

- Docker daemon status.
- Docker Compose project readability.
- Postgres, backend, Ollama, and gateway container health.
- Backend health through `http://danilo.local/api/health`.
- Frontend health through `http://danilo.local/`.
- Postgres database readiness.
- Ollama connection and active model loading.
- `danilo.local` local name resolution.
- Admin login endpoint using `admin` / `ProjectDANILO2026!`.
- Admin overview route access.

Expected result:

```text
[PASS] ... per successful check
[ok] Project DANILO verification passed
```

If verification fails, inspect:

```bash
sudo tail -n 200 /var/log/danilo-install.log
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120
sudo systemctl status danilo-stack.service danilo-ap.service dnsmasq.service hostapd.service --no-pager
```

Model verification:

```bash
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo exec -T ollama ollama list
sudo grep '^OLLAMA_MODEL=' /opt/danilo/app/.env
```

If `models/*.gguf` exists before install, the active model should be `danilo-custom`. If no GGUF file exists, the active model should be `qwen2.5:1.5b-instruct-q4_K_M`.
