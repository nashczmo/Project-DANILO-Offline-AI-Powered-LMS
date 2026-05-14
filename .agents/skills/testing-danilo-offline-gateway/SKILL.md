---
name: testing-danilo-offline-gateway
description: Test Project DANILO generated gateway validation and offline Inter font service-worker behavior end-to-end.
---

# DANILO Offline Gateway Testing

Use this skill when validating changes to the Project DANILO installer, generated Nginx gateway config, bundled Inter fonts, or service worker offline behavior.

## Devin Secrets Needed

- None for local generated-artifact testing.

## Setup

1. Work from the repo root and ensure the target branch is checked out.
2. If browser testing is needed, maximize Chrome before recording:
   ```bash
   sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y wmctrl
   wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
   ```
3. If scripting Chrome through CDP, `websocket-client` is useful:
   ```bash
   python3 -m pip install --user websocket-client
   ```

## Generate Test Artifacts

Render installer-generated files into a disposable directory under `/home/ubuntu`, not `/tmp`, so evidence survives restarts. Source the installer modules, set `PROJECT_ROOT`, `APP_ROOT`, `CONTENT_ROOT`, `BACKUP_ROOT`, `PORTAL_DOMAIN`, `LAN_IP`, DB/JWT/admin defaults, then run:

```bash
write_backend_files
write_frontend_files
write_gateway_files
write_project_docs
write_env_file
npm --prefix "$APP_ROOT/frontend" install --no-audit --no-fund
npm --prefix "$APP_ROOT/frontend" run build
```

When running this as a non-root test harness, override root-only permission helpers or write `.env` with test permissions only; do not change production installer behavior.

## Gateway Assertions

- Generated `infra/nginx/default.conf` must not contain top-level `sendfile`, `tcp_nopush`, `tcp_nodelay`, or `keepalive_timeout` directives.
- Generated config should include `location /fonts/` so bundled fonts are served locally.
- To test offline-safe validation, put a fake `docker` first on `PATH` where:
  - `docker info` exits `0`.
  - `docker image inspect nginx:1.27-alpine` exits nonzero.
  - `docker run` exits loudly if called.
- `validate_gateway_files` should exit `0`, warn that `nginx:1.27-alpine` is not cached locally, and not call `docker run`.
- If Docker and `nginx:1.27-alpine` are available locally, run:
  ```bash
  docker run --rm --add-host backend:127.0.0.1 \
    -v "$APP_ROOT/infra/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:1.27-alpine nginx -t
  ```
  Expected output includes `syntax is ok` and `test is successful`.

## Browser Offline Font Assertions

1. Serve the generated production frontend:
   ```bash
   python3 -m http.server 4173 --directory "$APP_ROOT/frontend/dist"
   ```
2. Open `http://127.0.0.1:4173/` in Chrome and wait for `navigator.serviceWorker.ready`.
3. Verify CacheStorage contains `danilo-static-v6` and all four bundled fonts:
   - `/fonts/Inter-Regular.woff2`
   - `/fonts/Inter-Medium.woff2`
   - `/fonts/Inter-SemiBold.woff2`
   - `/fonts/Inter-Bold.woff2`
4. Stop the static server and navigate to a same-origin path such as `/offline-proof`.
5. Expected offline state:
   - Heading: `DANILO is offline`
   - Paragraph: `The local portal could not be reached. Refresh after the gateway is back online.`
   - `document.fonts.check("400 16px Inter")` returns `true`.
   - At least one `FontFaceSet` entry for family `Inter` has status `loaded`.
   - Fetching `/fonts/Inter-Regular.woff2` returns HTTP `200` with nonzero bytes.

## Reporting

- Record browser testing with annotations when showing the offline fallback visually.
- Include screenshots of online/cache-ready and offline-fallback states in `test-report.md`.
- If testing an open PR, post exactly one PR comment with concise pass/fail bullets and a link to the Devin session.
