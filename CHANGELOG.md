# Changelog

All notable changes to Project DANILO will be documented in this file.

## [v1.0-alpha] - Project DANILO v1.0 Alpha

### Summary
Project DANILO v1.0 Alpha is the first public alpha release of the offline-first, AI-powered Learning Management System designed for local school deployments. It provides a robust, Dockerized stack with an automated installer for Ubuntu, featuring a Captive Portal for mobile access and local AI capabilities via Ollama.

### Major Features
- **Offline LMS:** Full LMS functionality without internet access, including Admin, Teacher, and Student portals.
- **Local AI Tutor & Insights:** AI capabilities powered by Ollama running entirely offline.
- **Dockerized Stack:** FastAPI backend, React/Vite frontend, PostgreSQL database, and Nginx gateway.
- **Ubuntu Installer:** Single-command `danilo.sh` script to install, update, verify, and uninstall the system.
- **WiFi Captive Portal:** Built-in AP support to serve the LMS locally to mobile devices without an internet connection.

### Installation Notes
- Target OS: **Ubuntu 24.04 LTS** (recommended) with sudo/root access.
- Requires internet access during initial setup to pull Docker images and AI models.
- Run `sudo bash danilo.sh --install` to begin.
- Use `sudo bash danilo.sh --verify` after installation to confirm system health.

### Upgrade Notes
- As this is the first alpha release, there are no prior versions to upgrade from.
- Future updates can be applied using `sudo bash danilo.sh --update`.

### Breaking Changes
- N/A (Initial alpha release).

### Known Limitations & Issues
- **Captive Portal Popup:** Automatic captive portal popup behavior is OS-dependent (iOS/Android). Users may need to manually navigate to `http://10.10.0.1` or disable "Private DNS"/VPNs.
- **Local AI Performance:** AI generation speed depends on host hardware and model quantization.
- **Alpha Stability:** This is an alpha release. It is not yet recommended for production deployments containing sensitive student data without strict manual review of backups, security, and data persistence.

### Recommended Deployment Checklist
- [ ] Test on a clean Ubuntu environment before real-world deployment.
- [ ] Verify WiFi adapter compatibility for the Captive Portal feature.
- [ ] Ensure adequate storage for AI models (typically 5GB+ depending on the model).
- [ ] Record the automatically generated admin credentials safely.
- [ ] Run `sudo bash danilo.sh --verify` to ensure all components are active.
