# Development Guide

Welcome to the Project DANILO developer guide! This document outlines how to modify the codebase effectively without breaking the dynamic installer behavior.

## The Generation Pattern

Unlike standard web applications, Project DANILO does not ship with a static `docker-compose.yml` or a pre-compiled frontend. 

The master orchestrator (`danilo.sh` and the `lib/*.sh` modules) **generate the runtime files dynamically** on the host machine. 
For example, the React frontend is dynamically written and compiled by `lib/frontend.sh` based on the host's environment, before being dumped into `/opt/danilo/app/frontend/dist/`.

### Modifying the Installer
If you are changing the installation flow:
- Edit the functions within `lib/*.sh` (e.g., `lib/services.sh` for systemd logic or Docker Compose heredocs).
- **Bash Rules:** Do not use bashisms that require GNU-specific edge cases; aim for high POSIX compatibility where possible, but Bash 4+ arrays and logic are acceptable. Ensure `set -Eeuo pipefail` is respected.

### Modifying the Backend
The FastAPI backend resides in the `backend/` directory.
- **Routers:** Add new endpoints under `backend/app/api/v1/`.
- **Database:** Modify `backend/app/models.py` to update the SQLAlchemy schema. Note that the installer creates the tables automatically on start.
- **Local Testing:** You can test the backend Python code locally via `uvicorn backend.app.main:app --reload`, provided you have a local PostgreSQL instance running.

### Modifying the Frontend
Because the frontend source is generated via `lib/frontend.sh`, you must edit the heredocs inside `lib/frontend.sh` to change the React logic. 
- *Why this pattern?* This ensures that the installation payload remains a single transportable bash repository without requiring gigabytes of `node_modules` during the offline transfer phase.

## Safe Commits

**DO NOT COMMIT GENERATED FILES.**
Ensure your local Git instance respects the repository's `.gitignore`. 
Do not commit:
- `/opt/danilo/` contents
- `docker-compose.yml`
- `.env`
- `danilo-credentials.txt`
- Large `.gguf` model files

## Running Tests Locally
Before submitting a PR, always validate your changes:
```bash
# Validate Bash Syntax
bash -n danilo.sh
for f in lib/*.sh; do bash -n "$f"; done

# Validate Python Syntax
python3 -m py_compile backend/app/*.py backend/app/api/v1/*.py backend/app/core/*.py
```
