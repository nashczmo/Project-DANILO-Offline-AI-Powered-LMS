# Contributing to Project DANILO

First off, thank you for considering contributing to Project DANILO! It's people like you that make Project DANILO a great tool for offline-first education.

## Development Setup

Please refer to [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed instructions on setting up your local environment, understanding the installer logic, and modifying the backend or frontend services.

## Important Rules

1. **Do not commit generated files:** Project DANILO generates its frontend static build, `docker-compose.yml`, `.env`, and credential files at runtime. **Never commit these files to the repository.** Ensure your `.gitignore` is active.
2. **Do not commit large AI models:** The `models/` directory is meant for local use. Do not commit `.gguf` or `.bin` files unless explicitly requested as part of a tracked Git LFS strategy.
3. **Keep offline-first in mind:** Every feature you build must degrade gracefully or work completely offline once the initial installation is complete.
4. **Test the installer:** Before submitting a Pull Request, run the validation checks:
   - `bash -n danilo.sh`
   - `sudo bash danilo.sh --clean-install`
   - `sudo bash danilo.sh --verify`

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`docs/RELEASE_CHECKLIST.md`).
4. Issue that pull request!
