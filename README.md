# Project DANILO

![Status](https://img.shields.io/badge/Status-Beta-blue)

Project DANILO is a complete, offline-first, AI-native Learning Management System (LMS) engineered for low-connectivity environments. It features a premium, role-based UI (Student, Teacher, Admin), live dynamic hardware benchmarking for optimized offline AI (via WhichLLM), and is designed for strict educational alignment.

By running a single command, the installer generates a localized stack comprising FastAPI, React, PostgreSQL, Nginx, Docker Compose, optional Wi-Fi captive portal services, and stable Ollama AI inference.

---

## Key Features

- **True Offline-First:** Fully functional without an internet connection post-installation.
- **Dynamic AI Hardware Optimization:** Automatically benchmarks host capabilities via `WhichLLM` to select the most performant open-source AI model available (quantized GGUF models).
- **Graceful Degradation:** The core LMS is completely decoupled from the AI and Wi-Fi AP systems. If AI models fail to download or Wi-Fi hardware is missing, the system gracefully degrades without taking down the core LMS.
- **Automated Security:** Cryptographically random credentials are generated automatically on installation. No insecure static passwords.
- **Modular RBAC Backend:** Fast, asynchronous FastAPI backend utilizing role-based access control and strict dependency injection.

## Architecture Overview

```text
Browser / Wi-Fi Client
  |
  v
Nginx Gateway (Port 80)
  |---- /api ---> FastAPI Backend (Uvicorn) ---> PostgreSQL Database
  |---- static -> React Frontend (Vite Build)
  |
  v
Optional Ollama AI Runtime (Inference Engine)
```

For more architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Supported Platforms

- **OS:** Ubuntu (e.g., 20.04, 22.04, 24.04). The installer automatically provisions missing dependencies (Docker, Node, Curl, etc.) and falls back to stable LTS repositories when needed.
- **Hardware:** Ranges from constrained laptops to dedicated GPU towers. See the "AI Runtime And Models" section for scaling logic.

## Quick Start (Fresh Install)

Copy this `danilo-installer` folder to a fresh Ubuntu machine, then run:

```bash
sudo bash danilo.sh --clean-install
```

### Verification

To run the automated suite of health checks:

```bash
sudo bash danilo.sh --verify
```

### Accessing the LMS

Depending on your hardware capability:
- **Captive Portal / AP Mode:** `http://danilo.local`
- **Laptop / Local Mode:** `http://localhost` or `http://<machine-ip>`

### Admin Credentials

The installer generates a cryptographically secure random password. You can find your credentials in the console output after a successful install, or saved locally at `/opt/danilo/danilo-credentials.txt`. 

To override this default behavior explicitly:
```bash
sudo DANILO_ADMIN_PASSWORD="MySecurePassword" bash danilo.sh --clean-install
```

## Folder Structure

```text
danilo.sh              # Master installer entrypoint
lib/                   # Orchestration modules (network, docker, AI, preflight)
models/                # Offline GGUF models (place local .gguf models here)
docs/                  # Documentation and guides
backend/               # FastAPI backend source code
frontend/              # React frontend source code
scripts/               # Maintenance and utility scripts
```

## Advanced Operations

```bash
sudo bash danilo.sh --install            # Standard install/repair (preserves data)
sudo bash danilo.sh --clean-install      # Destructive reinstall (resets data)
sudo bash danilo.sh --update             # Rebuild images & restart stack
sudo bash danilo.sh --rebuild-frontend   # Rebuild React UI only
sudo bash danilo.sh --verify             # Execute health checks
sudo bash danilo.sh --uninstall          # Tear down systemd units and services
```

For detailed troubleshooting or manual verification steps, consult [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) and [docs/VERIFY.md](docs/VERIFY.md).

## Security

Please review our [SECURITY.md](SECURITY.md) policy before deploying to a production network. 

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to get started safely. For developer setup instructions, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

This project is licensed under the [MIT License](LICENSE).
