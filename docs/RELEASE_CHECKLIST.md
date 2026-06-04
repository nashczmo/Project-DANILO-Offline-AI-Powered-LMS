# Pre-Release Checklist

Before tagging a new version or deploying Project DANILO to a pilot school, execute the following validation checks to ensure repository integrity.

## 1. Syntax Validation
Ensure there are no trailing syntax errors or Python compilation failures. 

**Bash scripts:**
```bash
bash -n danilo.sh
for f in lib/*.sh; do bash -n "$f"; done
```

**Python backend:**
```bash
python3 -m py_compile backend/app/*.py backend/app/api/v1/*.py backend/app/core/*.py
```

## 2. Fresh Installation Test
On a fresh Ubuntu machine (or VM/container representing the target environment), run a destructive installation to assert zero state drift:

```bash
sudo bash danilo.sh --clean-install
```
*Ensure the final success output accurately prints the Captive Portal URLs or the Local-Only IP fallbacks, and the randomly generated admin credentials.*

## 3. Automated Verification Test
Assert that the core LMS passes health checks:

```bash
sudo bash danilo.sh --verify
```
*Ensure no `[FAIL]` markers appear. It is acceptable for `[WARN]` markers to appear for AI/AP services if the testing hardware lacks a GPU or Wi-Fi NIC.*

## 4. Manual Healthcheck Probes
Verify the internal routing explicitly:

**Backend Healthcheck:**
```bash
curl -fsS http://127.0.0.1:8000/api/health
```

**Gateway Proxy:**
```bash
curl -fsS -H "Host: danilo.edu" http://127.0.0.1/
```

## 5. UI & Authentication Test
1. Open a browser and navigate to `http://localhost` (or the IP of your test VM).
2. Attempt to log in using the credentials generated in `/opt/danilo/danilo-credentials.txt`.
3. Verify that the admin dashboard loads without breaking Vite bundle errors.

## 6. Repository Hygiene
Before committing:
1. Ensure `git status --short` is clean and does not include accidental `.env` files, `.log` files, or `danilo-credentials.txt`.
2. Check that the README accurately reflects the current state of features, OS support, and behavior.
3. Review secrets. Never commit static passwords or hardcoded JWT secret keys into the repository structure.
