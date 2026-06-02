# Installation Guide

Project DANILO is designed to be installed on a fresh Ubuntu machine. The installer orchestrates the provisioning of dependencies, Docker, Node.js, network interfaces, and the core software stack.

## Ubuntu Deployment Readiness

Recommended target environment:
- **OS:** Ubuntu 24.04 LTS
- **Privileges:** `sudo`/root access is strictly required
- **Dependencies:** Docker support (the installer will attempt to install it if missing)
- **Networking (Captive Portal):** WiFi adapter with AP (Access Point) mode support
- **Hardware (AI):** Sufficient storage and RAM for the AI model (min 8GB+ RAM recommended for Ollama models)
- **Internet:** Internet access is required **only** during the initial installation to pull images and dependencies.

## Installer Commands (`danilo.sh`)

Project DANILO includes a comprehensive bash installer to manage the lifecycle of the stack.

- `sudo bash danilo.sh --install` (or `--quick-install`)
  - **What it does:** Performs a highly-optimized, minimal installation of the core LMS stack. Skips the large AI model downloads by default for speed.
  - **Data:** Preserves existing database and Docker volumes.

- `sudo bash danilo.sh --full-install`
  - **What it does:** Installs the LMS and preloads the dynamic hardware-optimized AI models (can take significantly longer depending on internet speed).
  - **Data:** Preserves existing database and Docker volumes.

- `sudo bash danilo.sh --clean-install`
  - **What it does:** Performs a destructive fresh installation from scratch.
  - **Data:** **RESETS/WIPES** all DANILO Docker volumes and database data. Use with caution.

- `sudo bash danilo.sh --update`
  - **What it does:** Regenerates configuration files, rebuilds images, and restarts the stack.
  - **Data:** Preserves existing data. Use this after pulling new Git updates.

- `sudo bash danilo.sh --rebuild-frontend`
  - **What it does:** Regenerates and rebuilds only the frontend (React/Vite) gateway image.
  - **Data:** Preserves all data. Use if you only made UI modifications.

- `sudo bash danilo.sh --verify`
  - **What it does:** Runs post-install health checks on containers, network, and endpoints.
  - **Data:** Read-only operation.

- `sudo bash danilo.sh --sync`
  - **What it does:** Mirrors local lesson content into the container volume and restarts the gateway.
  - **Data:** Preserves database data, only syncs static assets.

- `sudo bash danilo.sh --uninstall`
  - **What it does:** Stops all DANILO services and removes generated system/app files in `/opt/danilo`.
  - **Data:** Docker data volumes are kept by default unless `DANILO_RESET_DATA=1` is exported.

## Demo Seed Data

You can automatically seed the database with sample LMS data for testing purposes using an environment variable:

```bash
sudo DANILO_SEED_DEMO=1 bash danilo.sh --clean-install
```

> **⚠️ Warning:**
> By default, the installer only seeds the admin account. Demo data is completely optional. 
> Enabling `DANILO_SEED_DEMO=1` can wipe or recreate demo LMS data. It should **not** be used on production data unless intentional.

## Post-Installation

After installation completes successfully, run the verification script:
```bash
sudo bash danilo.sh --verify
```

Credentials for the generated Admin account will be printed to the console and saved securely to `/opt/danilo/danilo-credentials.txt`.
