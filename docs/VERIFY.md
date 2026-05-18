# Project DANILO Verification Guide

Run verification after every install, clean install, update, frontend rebuild, and reboot.

```bash
sudo bash danilo.sh --verify
```

The deployment verifier checks:

- Docker daemon and Docker Compose project
- `postgres`, `backend`, active AI runtime, and `gateway` containers
- Backend `/api/health`
- Frontend gateway
- PostgreSQL readiness
- AI runtime reachability and active model loading
- `danilo.local` name resolution
- Admin login using `admin` / `ProjectDANILO2026!`

Repository-side preflight before copying to Ubuntu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
```

The verifier checks:

- Docker daemon status.
- Docker Compose project readability.
- Postgres, backend, AI runtime, and gateway container health.
- Backend health through `http://danilo.local/api/health`.
- Frontend health through `http://danilo.local/`.
- Postgres database readiness.
- AI runtime connection and active model loading.
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
sudo grep '^DANILO_AI_RUNTIME=' /opt/danilo/app/.env
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo exec -T ollama ollama list
```

Default installs use Ollama and should show `phi3:mini` or `danilo-custom`. llama.cpp installs should show `DANILO_AI_RUNTIME=llamacpp` and a matching GGUF filename in `DANILO_AI_PRIMARY_MODEL`.
