# Installation Guide

Project DANILO is designed to be installed on a fresh Ubuntu machine. The installer orchestrates the provisioning of dependencies, Docker, Node.js, network interfaces, and the core software stack.

## Prerequisites

- **Operating System:** Ubuntu Linux (e.g., 20.04, 22.04, 24.04). The installer uses capability checks rather than hardcoded OS versions, gracefully falling back to stable LTS package repositories if needed.
- **Privileges:** `sudo` access is required.
- **Internet Access:** Required **only once** during the initial installation to pull Docker images, Ubuntu dependencies, and the AI model. Afterward, the system is fully offline-capable.

## Core Installation Commands

### Fresh / Clean Install (Recommended)
This command will purge any existing Project DANILO Docker volumes, reset the database, and execute a fresh installation from scratch.

```bash
sudo bash danilo.sh --clean-install
```

### Standard Install / Repair
This command will install or repair the software stack while attempting to **preserve** your existing database and Docker volumes.

```bash
sudo bash danilo.sh --install
```

### Update
If you have pulled new code from Git, use this command to regenerate the configuration files, rebuild the frontend/backend images, and restart the stack (preserves data).

```bash
sudo bash danilo.sh --update
```

## Post-Installation Verification

After the installation finishes, the script automatically runs a suite of health checks. To run these checks manually at any time:

```bash
sudo bash danilo.sh --verify
```

*Note: The verification script differentiates between the "Core LMS" and "Optional Features". If an optional AI model is missing, the verification will show a `[WARN]` but the overall verify script will still pass.*

## Optional Features

### AI / Ollama Setup
By default, the installer uses `WhichLLM` to dynamically benchmark your hardware and download the best quantized AI model. 
If you want to bypass this and explicitly pin a model, set the environment variable:

```bash
sudo DANILO_OLLAMA_MODEL=phi4-mini bash danilo.sh --clean-install
```

### Wi-Fi / Captive Portal Setup
The installer attempts to unmask and configure `hostapd` and `dnsmasq` to broadcast a local captive portal. 
If the host machine lacks a compatible Wi-Fi NIC, the installer gracefully aborts the AP configuration and falls back to **Local-Only Mode**.

## Accessing the LMS

Depending on the success of the Wi-Fi AP setup, the installer will output the correct URLs at the end of the script:
- **Captive Portal Success:** `http://danilo.local`
- **Local-Only Mode Fallback:** `http://localhost` or `http://<machine-ip>`

## Locations & Storage

- **Runtime Files:** All generated configuration files, Docker Compose scripts, and frontend bundles are stored at `/opt/danilo/`.
- **Log Files:** The master installation trace is written to `/var/log/danilo-install.log`.
- **Credentials:** The installer generates a cryptographically random admin password. It will be printed to the terminal upon success and saved to `/opt/danilo/danilo-credentials.txt`. **Do not commit this file to Git.**
