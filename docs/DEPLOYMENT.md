# Deployment Guide

Project DANILO is designed to be deployed in low-connectivity, offline environments. Even though it is currently in Alpha, there are best practices you should follow for a robust deployment.

## Ubuntu Deployment Readiness

The recommended deployment target is a dedicated Ubuntu machine (like an Intel NUC, older laptop, or small tower).

- **OS:** Ubuntu 24.04 LTS is strongly recommended.
- **Access:** You must have root or `sudo` access to run the installer.
- **Docker Support:** Docker is required and will be installed by `danilo.sh` if not present.
- **WiFi Adapter (Captive Portal):** If you intend to use the Captive Portal feature to broadcast a local WiFi network, the host machine must have a WiFi adapter that supports AP (Access Point) mode.
- **Hardware (AI Model):** If you plan to run the AI Tutor and Teacher Insights features, ensure sufficient RAM (8GB+ recommended) and storage (10GB+ free for GGUF models).
- **Initial Setup:** The machine MUST have internet access during the initial `sudo bash danilo.sh --install` run to download Docker images, Ubuntu dependencies, and Ollama models. Once installed, it is fully offline.

## Pre-Deployment Checklist

- [ ] Clean OS installation (Ubuntu 24.04).
- [ ] Connect to the internet.
- [ ] Run the installer `sudo bash danilo.sh --install`.
- [ ] Run `sudo bash danilo.sh --verify` to ensure all components are healthy.
- [ ] Record the generated Admin credentials and store them securely.
- [ ] Test client connections via Captive Portal or Local Network.
- [ ] Disconnect from the internet to verify full offline capability.

## Alpha Considerations

As an alpha release, stability is continually improving. Before deploying in a live school environment:
- Review the handling of generated secrets in `/opt/danilo/danilo-credentials.txt`.
- Establish a routine backup process for the PostgreSQL data volume (`danilo_db_data`).
- Understand data persistence: use `--install` for updates, NOT `--clean-install`, unless you intend to destroy all user data.
- Test power-loss scenarios to ensure `danilo-stack.service` starts cleanly on system reboot.
