# Project DANILO Architecture

This document describes the high-level architecture and data flow for Project DANILO. 

Project DANILO is designed to be installed on offline-capable hardware. It consists of a master orchestration script (`danilo.sh`) which provisions a Docker Compose stack, alongside optional systemd network components.

## High-Level Topology

```text
       Browser / Wi-Fi Client
                 |
                 v
       +-------------------+
       |   Nginx Gateway   |  (Docker Container, Ports 80)
       +---------+---------+
                 |
        +--------+--------+
        |                 |
        v                 v
+---------------+  +--------------+
| React Frontend|  | FastAPI API  |
| (Static Vite) |  |   (Uvicorn)  |
+---------------+  +------+-------+
                          |
                          v
                   +--------------+
                   |  PostgreSQL  |
                   |   Database   |
                   +--------------+

=======================================================
               Optional Services
=======================================================

+-----------------+    +-------------------------+
| Ollama Runtime  |    | Wi-Fi AP (hostapd)      |
| (AI Inference)  |    | DNS Server (dnsmasq)    |
| (Docker)        |    | (systemd baremetal)     |
+-----------------+    +-------------------------+
```

## 1. Installer Flow

When `sudo bash danilo.sh --clean-install` is executed:
1. **Pre-flight & Bootstrap:** `apt-get` non-interactively installs missing OS utilities (`jq`, `curl`, `awk`).
2. **Dependency Provisioning:** Docker Engine and Node.js are securely fetched and installed via official PPA keys if absent.
3. **Environment Generation:** A cryptographically secure `.env` file is generated, housing the new DB credentials and Admin passwords.
4. **Configuration Generation:** The installer builds the backend Python scripts and the Vite frontend codebase, compiling the static assets.
5. **Docker Compose Orchestration:** A `docker-compose.yml` file is generated dynamically, pointing to the built assets and locking in the AI hardware profiles.
6. **Service Launch:** Docker Compose spins up `db`, `backend`, `gateway`, and `ollama` containers. 
7. **Verification:** The script runs internal API health checks.

## 2. Runtime Flow

Once the stack is running:
1. **Gateway:** The Nginx `gateway` container listens on port 80. It serves the static React frontend bundle from disk. Any requests hitting `/api/*` are reverse-proxied to the `backend` container.
2. **Backend:** The FastAPI `backend` handles RBAC logic, authentication, and database operations.
3. **Database:** The `db` PostgreSQL container houses all persistent state (users, classes, lessons, grades). It is mounted to a local Docker volume to survive reboots and updates.
4. **AI Inference:** When the backend receives a generative task, it queries the `ollama` container via HTTP on its internal Docker network.

## 3. Core LMS vs. Optional Degraded Services

Project DANILO strictly decouples the **Core LMS** from **Optional Services**.

- **Core LMS (Required):** PostgreSQL, FastAPI, Nginx Gateway, React Frontend.
  *If any of these fail, the installer halts and the system is unusable.*
- **AI/Ollama (Optional):** If the AI model fails to download (e.g. no internet), the FastAPI backend simply degrades the generative AI features. The core LMS remains online.
- **Wi-Fi AP (Optional):** If the physical machine lacks a Wi-Fi card, `danilo-ap.service` warns the user and degrades gracefully into **Local-Only mode**. Users can still access the LMS via an ethernet switch or `http://localhost`.
