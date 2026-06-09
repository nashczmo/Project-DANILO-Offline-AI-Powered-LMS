# Project DANILO v1.0 Alpha

Project DANILO is an offline-first, AI-powered LMS for local school deployment.

## Highlights
- Offline LMS with admin, teacher, and student portals
- Local AI Tutor and Teacher AI Insights
- Dockerized FastAPI, React, PostgreSQL, and Nginx stack
- Ubuntu installer and verifier
- WiFi captive portal support for local access

## Install

```bash
sudo bash danilo.sh --install
```

## Verify

```bash
sudo bash danilo.sh --verify
```

## Alpha Notice

This is an alpha release. Test in a clean Ubuntu environment before using with real school data.

## Known Limitations

- Captive portal auto-popup depends on Android/iOS behavior.
- Local AI performance depends on hardware and model availability.
- Production deployments should review secrets, backups, and data persistence.
