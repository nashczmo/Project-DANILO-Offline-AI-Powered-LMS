# Project DANILO Installer

Project DANILO packages an offline-first, DepEd-aligned AI-native learning LMS for low-connectivity schools. The installer generates a complete local stack with FastAPI, React, PostgreSQL, Nginx, Docker Compose, Wi-Fi captive portal services, llama.cpp production inference, and Ollama development fallback.

Default administrator credentials:

- Username: `admin`
- Password: `ProjectDANILO2026!`

Override via `DANILO_ADMIN_USERNAME` and `DANILO_ADMIN_PASSWORD` environment variables.

## Quick Start

Copy this `danilo-installer` folder to a fresh Ubuntu 24.04 machine, then run:

```bash
sudo bash danilo.sh --clean-install
```

Verify:

```bash
sudo bash danilo.sh --verify
```

Open:

```text
http://danilo.local
```

Logs are written to `/var/log/danilo-install.log`. Backups are stored in `/var/backups/danilo`.

## Folder Structure

```text
danilo.sh              # installer entrypoint
lib/                   # installer, backend, frontend, AI, network, service, verification modules
models/                # offline GGUF models, e.g. Phi-3 Mini Instruct Q4_K_M
docs/                  # install, model, troubleshooting, verification, release docs
scripts/               # repository-side verification helpers
```

The runtime frontend is generated only by `lib/frontend.sh` under `/opt/danilo/app/frontend` on Ubuntu. Docker, nginx, backend, systemd, and frontend runtime files are generated from the `lib/` modules; there is no separate template frontend source.

## Supported Modes

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

`--install`, `--update`, and `--rebuild-frontend` preserve existing data. `--clean-install` resets data only through the clean-install/reset path.

## AI Runtime And Models

DANILO production mode is llama.cpp with `Phi-3 Mini Instruct GGUF Q4_K_M` as the primary model and `Gemma 2 2B Q4_K_M` as fallback. Put the GGUF files in `models/` before install and keep the default `DANILO_AI_RUNTIME=llamacpp`.

For development without GGUF files, use Ollama:

```bash
sudo DANILO_AI_RUNTIME=ollama DANILO_OLLAMA_MODEL=phi3:mini bash danilo.sh --install
```

See `docs/CUSTOM_MODEL.md`.

## Local Repository Check

On Windows before copying to Ubuntu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1
```

## Demo Data

For pilot validation with sample teachers, students, classes, lessons, assignments, and grades:

```bash
sudo DANILO_SEED_DEMO=1 bash danilo.sh --install
```

Then run:

```bash
sudo bash danilo.sh --verify
```

See `docs/RELEASE_CHECKLIST.md` and `docs/SMOKE_TESTS.md` before school pilot deployment.

## Documentation

- `docs/INSTALL.md`
- `docs/TROUBLESHOOTING.md`
- `docs/CUSTOM_MODEL.md`
- `docs/VERIFY.md`
- `docs/RELEASE_CHECKLIST.md`
