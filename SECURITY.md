# Security Policy

## Supported Versions

Currently, the **main branch (v1.1 Beta)** is receiving active security updates.

## Security Architecture Notes

- **Credentials:** Project DANILO generates cryptographically random passwords during the installation phase (via `openssl rand`). **There are no default static passwords.**
- **Networking:** The Nginx gateway handles all external traffic. Direct access to internal database ports or FastAPI backend ports is blocked from the outside.
- **Offline Integrity:** Because the system is designed to operate completely offline, external threat vectors are severely limited post-installation.

## Reporting a Vulnerability

If you discover a security vulnerability within Project DANILO, please do not disclose it publicly until it has been patched. Please open a private security advisory on GitHub or contact the maintainers directly. We will strive to acknowledge and resolve the issue as quickly as possible.
