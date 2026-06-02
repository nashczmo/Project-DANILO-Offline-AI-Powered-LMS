# Project DANILO — Offline AI-Powered LMS

![Status](https://img.shields.io/badge/Status-Alpha-orange) ![License](https://img.shields.io/badge/License-MIT-blue)

> **⚠️ Alpha Release Notice**
> Project DANILO v1.0 Alpha is an early release. Test thoroughly in a clean Ubuntu environment before deploying with real school data. Production deployments should carefully review secrets, backups, and data persistence strategies.

## Overview
Project DANILO is a complete, offline-first, AI-powered Learning Management System (LMS) designed for local school deployments in low-connectivity environments. 

By running a single command on a clean Ubuntu host, the installer generates a localized stack featuring FastAPI, React, PostgreSQL, Nginx, Docker Compose, optional Wi-Fi captive portal services, and offline AI capabilities (via Ollama).

## Features
- **True Offline-First:** Fully functional without internet access post-installation.
- **Role-Based Portals:** Dedicated interfaces for Admin, Teacher, and Student roles.
- **AI Tutor & Teacher Insights:** AI capabilities that operate entirely offline, dynamically adapting to hardware constraints.
- **Graceful Degradation:** The core LMS is decoupled from the AI and Wi-Fi AP systems. If AI models fail to load or Wi-Fi hardware is unsupported, the system degrades gracefully without crashing the core LMS.
- **Automated Deployment:** Automated installation and verification scripts for Ubuntu targets.
- **Captive Portal:** Built-in Wi-Fi access point support for mobile device access.

## Architecture
- **Backend:** FastAPI (Python), utilizing robust Role-Based Access Control (RBAC).
- **Frontend:** React / Vite.
- **Database:** PostgreSQL.
- **Gateway:** Nginx.
- **AI Runtime:** Ollama (serving quantized GGUF models).
- **Deployment:** Docker Compose orchestrated via `danilo.sh`.

## Screenshots
> *(Screenshots placeholder: Insert images of the Admin Dashboard, Student Portal, and Teacher AI Insights here in future releases)*

## System Requirements
- **OS:** Ubuntu 24.04 LTS (recommended) with sudo/root access.
- **Dependencies:** Docker support (automatically installed if missing).
- **Network:** Internet access is required **only** during the initial installation to pull images and models. 
- **Hardware:**
  - Wi-Fi adapter with AP mode support (if using the captive portal).
  - Sufficient storage and RAM for the AI model (requirements vary based on model choice).

## Installation

### Quick Start
To install on a fresh Ubuntu machine, run:
```bash
sudo bash danilo.sh --clean-install
```

### Installation Commands (`danilo.sh`)
- `sudo bash danilo.sh --quick-install` : (Default alias for `--install`). Fast, minimal core LMS install. Skips large AI models by default.
- `sudo bash danilo.sh --full-install` : Installs the LMS and preloads dynamic AI models.
- `sudo bash danilo.sh --clean-install` : Destructive install. Resets data and Docker volumes.
- `sudo bash danilo.sh --uninstall` : Stops services and removes generated app files.

For deep deployment details, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Updating
If you pull new code from GitHub and need to apply updates without losing data:
```bash
sudo bash danilo.sh --update
```
To rebuild only the React frontend UI:
```bash
sudo bash danilo.sh --rebuild-frontend
```
To sync offline content:
```bash
sudo bash danilo.sh --sync
```

## Verification
To run the automated suite of health checks:
```bash
sudo bash danilo.sh --verify
```

## Accessing the Portal
Depending on your hardware capability and network setup:
- **Captive Portal / AP Mode:** `http://danilo.local`
- **Manual Fallback / AP Mode:** `http://10.10.0.1`
- **Local Mode:** `http://localhost` or `http://<machine-ip>`

## Admin Setup
By default, the installer generates a cryptographically secure random admin password. Find your credentials in the console output after a successful install, or saved locally at `/opt/danilo/danilo-credentials.txt`.

## Demo Data
To seed the database with demo LMS data, set the environment variable:
```bash
DANILO_SEED_DEMO=1
```
> **⚠️ Warning:** By default, only the admin account is seeded. Enabling demo seed can wipe or recreate demo LMS data. Do not use on production data unless intentional.

## AI/Ollama Setup
Project DANILO uses Ollama for local AI inference. 
- AI features can run degraded or fully offline.
- If the AI model is unavailable, the core LMS will continue to function normally.
- Teacher AI Insights depend on backend database class data.
- The AI Tutor depends on local AI runtime availability.

For details, read [docs/AI_SETUP.md](docs/AI_SETUP.md).

### AI Reliability and Status Matrix

DANILO is designed to gracefully degrade if the AI backend is unavailable. The core LMS will continue to function.
To enforce that the AI must be fully ready before the installer completes, run the installer with strict mode:
```bash
sudo DANILO_AI_REQUIRE_READY=1 bash danilo.sh --install
```

#### Checking AI Status
Run the built-in verification tool to check the health of the entire stack, including the AI:
```bash
sudo bash danilo.sh --verify
```

The AI can be in one of the following states:
- **READY**: Ollama API is reachable, and the configured model is installed and active.
- **DEGRADED**: Ollama is reachable, but the model is missing, or the backend AI health check reports degraded.
- **OFFLINE**: Ollama container is down or unreachable.
- **MODEL MISSING**: Ollama is up but the active model is not loaded.
- **STARTING**: The container is still initializing.

### Recovery Playbook

If the AI features are unavailable, try the following steps to diagnose and repair:

#### 1. Ollama container not running (OFFLINE)
Check if the container is running and view its logs:
```bash
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs ollama
```
Restart the container:
```bash
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo restart ollama
```

#### 2. Model Missing
If the verification script reports MODEL MISSING, you can attempt to pull it manually or run the quick installer again:
```bash
# To reinstall and ensure AI model pulls:
sudo DANILO_AI_ENABLE=1 bash danilo.sh --install
```
Alternatively, pull it directly:
```bash
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo exec ollama ollama pull <model-name>
```

#### 3. Backend cannot reach Ollama (DEGRADED/Timeout)
If the LMS is up but AI requests timeout, verify the backend network connection:
```bash
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo restart ollama backend
```

#### 4. Slow Hardware
If responses are too slow, consider downgrading the model class in `/opt/danilo/app/.env` and restarting the stack:
```bash
# Edit OLLAMA_MODEL to a smaller tutoring model like qwen2.5:3b
sudo nano /opt/danilo/app/.env
docker compose -f /opt/danilo/app/docker-compose.yml -p danilo up -d
```

## Captive Portal Notes for Android/iOS
The Wi-Fi captive portal popup behavior is OS-dependent. If the popup does not appear:
- Disable "Private DNS" (Android) or VPNs.
- Forget and rejoin the Wi-Fi network.
- Manually open `http://10.10.0.1` or `http://danilo.local`.
- Check if `danilo-ap.service` is running.

See [docs/CAPTIVE_PORTAL.md](docs/CAPTIVE_PORTAL.md) for more troubleshooting.

## Troubleshooting
Run the verification script to diagnose issues:
```bash
sudo bash danilo.sh --verify
```
For common issues, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Development Setup
For local development environments, please refer to [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Security
- Credentials are cryptographically generated on install.
- *Security reporting placeholder: Please report vulnerabilities to [Email/Contact].*

## Roadmap
- [x] Core offline LMS functionality
- [x] Dockerized deployment script
- [x] Wi-Fi Captive Portal support
- [x] Local AI integration
- [ ] Beta release testing
- [ ] Multi-school synchronization
- [ ] Advanced performance monitoring

## Contributing
We welcome contributions! Please read our contribution guidelines in `CONTRIBUTING.md` (coming soon) before submitting issues or pull requests.

## Release Status
**Current Version:** Project DANILO v1.0 Alpha

## License
MIT License
