# Changelog

All notable changes to Project DANILO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-05-26

### Added
- Comprehensive GitHub metadata and contributing rules.
- Robust installer diagnostics (`--verify` mode).
- Graceful degradation for Ollama and Wi-Fi AP services.
- Detailed architecture and developer documentation.

### Changed
- Refactored `docker-compose.yml` to rely on `service_healthy` rather than `service_started` for PostgreSQL, fully stabilizing FastAPI startup routines.
- Updated default `NODE_MAJOR` fallback to LTS version 20 to widen Ubuntu compatibility.
- Streamlined `danilo.sh` pre-flight to proactively install missing tools (`jq`, `curl`, `awk`) via noninteractive `apt-get` loops.

## [1.1.0-beta] - 2026-05-24

### Added
- Integrated WhichLLM for dynamic offline hardware benchmarking.
- Added modular API routers to FastAPI backend.
- Deployed rate limiting (slowapi) and robust RBAC dependency injection.
