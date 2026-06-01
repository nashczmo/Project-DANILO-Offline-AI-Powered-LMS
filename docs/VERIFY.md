# Verification Guide

Project DANILO includes a built-in verification suite that validates the integrity of the installed system.

## Running the Verification Suite

To run the automated suite of health checks:

```bash
sudo bash danilo.sh --verify
```

### What `verify_mode` Checks

The verification script systematically probes the system to assert readiness across the following layers:

1. **System & Tooling:** Validates the presence of base dependencies (`curl`, `jq`, `awk`), the Docker daemon, and the Docker Compose plugin.
2. **Container Health:** Queries Docker to ensure all core containers (`gateway`, `backend`, `db`) are actively running.
3. **Database & Backend:** 
   - Uses `pg_isready` to verify PostgreSQL is accepting connections.
   - Pings `/api/health` through the gateway proxy to assert the FastAPI backend is responding.
   - Checks that the database schema is correctly populated and the default admin user exists.
4. **Frontend & Gateway:** Asserts that the Vite static bundle is served correctly at the root Nginx path (HTTP 200).
5. **AI Runtime (Graceful):** Probes the Ollama API and active models. 

### Core LMS vs. Optional Degradation

A crucial aspect of the `--verify` command is the distinction between **Fatal** failures and **Degraded** statuses:

- **Fatal (`[FAIL]`):** If the database is unreachable, the backend healthcheck fails, or the frontend bundle is missing, the verification script will halt and report the entire installation as a failure.
- **Degraded (`[WARN]`):** If the Ollama AI model is missing (e.g., due to a lack of internet during installation) or the Wi-Fi AP fails to start, the script will output a `[WARN]` indicating the feature is "Degraded", but the overall script will still pass `[SUCCESS]`. The core LMS remains fully usable.

### Expected Successful Output

A fully successful, optimal installation will look like this:

```text
  [PASS] Base dependencies available
  [PASS] Docker daemon active
  [PASS] Docker Compose plugin available
  [PASS] Gateway container running
  [PASS] Backend container running
  [PASS] Database container running
  [PASS] Database connection works
  [PASS] Database schema present
  [PASS] Admin user seeded
  [PASS] Ollama CLI reachable
  [PASS] Ollama API reachable
  [PASS] Active AI model is loaded
  [PASS] Frontend reachable
  [PASS] Frontend static bundle reachable
```

If the AI model failed to download, you will safely see:
```text
  [WARN] Active AI model is loaded (Degraded)
```

## Manual Verification Commands

If you wish to test specific components manually, you can execute the following commands:

**Backend Health Check (Bypassing Gateway):**
```bash
curl -fsS http://127.0.0.1:8000/api/health
```

**Frontend Health Check (Through Gateway):**
```bash
curl -fsS -H "Host: danilo.local" http://127.0.0.1/
```

**Check Admin Login Configuration:**
Ensure your generated credentials exist:
```bash
cat /opt/danilo/danilo-credentials.txt
```

## What to do if verification fails

If the `--verify` script outputs `[FAIL]` and exits, consult the [Troubleshooting Guide](TROUBLESHOOTING.md).
Check the master log via `sudo tail -n 200 /var/log/danilo-install.log` and the component Docker logs (e.g., `sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo logs --tail=120 backend`).
