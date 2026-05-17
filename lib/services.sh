# Project DANILO installer module: services.sh

write_gateway_files() {
  mkdir -p "${APP_ROOT}/gateway" "${APP_ROOT}/infra/nginx"

  cat > "${APP_ROOT}/gateway/Dockerfile" <<'EOF'
FROM nginx:1.27-alpine

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /opt/danilo/app/frontend/dist && \
    chown -R nginx:nginx /opt/danilo/app/frontend/dist

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

  cat > "${APP_ROOT}/infra/nginx/default.conf" <<EOF
# Handles: captive portal, SPA serving, API proxying, PWA caching

upstream danilo_backend {
  server backend:8000;
  keepalive 32;
}

server {
  listen 80 default_server;
  server_name ${PORTAL_DOMAIN};
  root  /opt/danilo/app/frontend/dist;
  index index.html;

  gzip            on;
  gzip_comp_level 5;
  gzip_min_length 512;
  gzip_proxied    any;
  gzip_vary       on;
  gzip_types
    text/plain text/css text/xml text/javascript
    application/javascript application/json application/xml
    application/rss+xml image/svg+xml font/woff2;

  # Security headers
  add_header X-Content-Type-Options  "nosniff"        always;
  add_header X-Frame-Options         "SAMEORIGIN"     always;
  add_header Referrer-Policy         "no-referrer"    always;
  add_header X-XSS-Protection        "1; mode=block"  always;

  location = /hotspot-detect.html             { return 302 http://${PORTAL_DOMAIN}/; }
  location = /library/test/success.html       { return 302 http://${PORTAL_DOMAIN}/; }

  location = /generate_204                    { return 302 http://${PORTAL_DOMAIN}/; }
  location = /gen_204                         { return 302 http://${PORTAL_DOMAIN}/; }

  location = /ncsi.txt                        { return 302 http://${PORTAL_DOMAIN}/; }
  location = /connecttest.txt                 { return 302 http://${PORTAL_DOMAIN}/; }

  location = /success.txt                     { return 302 http://${PORTAL_DOMAIN}/; }
  location = /canonical.html                  { return 302 http://${PORTAL_DOMAIN}/; }

  location = /kindle-wifi/wifistub.html       { return 302 http://${PORTAL_DOMAIN}/; }

  # SSE streaming endpoint: disable all buffering so tokens reach the browser immediately
  location = /api/ai/tutor/stream {
    proxy_pass             http://danilo_backend/api/ai/tutor/stream;
    proxy_http_version     1.1;
    proxy_set_header       Connection          "";
    proxy_set_header       Host               \$host;
    proxy_set_header       X-Real-IP          \$remote_addr;
    proxy_set_header       X-Forwarded-For    \$proxy_add_x_forwarded_for;
    proxy_set_header       X-Forwarded-Proto  \$scheme;

    proxy_read_timeout     90s;
    proxy_send_timeout     90s;
    proxy_connect_timeout  10s;

    # Disable all buffering for Server-Sent Events
    proxy_buffering        off;
    proxy_cache            off;
    proxy_buffer_size      1k;
    add_header             X-Accel-Buffering "no" always;
  }

  location /api/ {
    proxy_pass             http://danilo_backend/api/;
    proxy_http_version     1.1;
    proxy_set_header       Connection          "";
    proxy_set_header       Host               \$host;
    proxy_set_header       X-Real-IP          \$remote_addr;
    proxy_set_header       X-Forwarded-For    \$proxy_add_x_forwarded_for;
    proxy_set_header       X-Forwarded-Proto  \$scheme;

    # Generous timeout for non-streaming AI requests on slow hardware
    proxy_read_timeout     90s;
    proxy_send_timeout     60s;
    proxy_connect_timeout  10s;

    proxy_buffer_size      16k;
    proxy_buffers          8 32k;
  }

  location /assets/ {
    expires            1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files          \$uri =404;
  }

  location ~* \.(webmanifest|json)$ {
    expires            1h;
    add_header Cache-Control "public, max-age=3600";
  }

  location = /sw.js {
    expires            -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
  }

  location /icons/ {
    expires            7d;
    add_header Cache-Control "public, max-age=604800";
    try_files          \$uri =404;
  }

  location /fonts/ {
    expires            1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files          \$uri =404;
  }

  location / {
    try_files \$uri /index.html;
  }
}

# Covers any unrecognized hostname that arrives on port 80 (captive portal trap)
server {
  listen 80;
  server_name _;
  return 302 http://${PORTAL_DOMAIN}\$request_uri;
}

server {
  listen 80;
  server_name connectivitycheck.gstatic.com
              clients3.google.com
              connectivity-check.ubuntu.com;
  return 302 http://${PORTAL_DOMAIN}/;
}

server {
  listen 80;
  server_name connect.rom.miui.com
              captive.v2.rom.miui.com;
  return 302 http://${PORTAL_DOMAIN}/;
}

server {
  listen 80;
  server_name connectivitycheck.platform.hicloud.com
              connectivitycheck.cloud.huawei.com;
  return 302 http://${PORTAL_DOMAIN}/;
}

server {
  listen 80;
  server_name www.msftncsi.com
              msftncsi.com
              dns.msftncsi.com;
  return 302 http://${PORTAL_DOMAIN}/;
}
EOF

  cat > "${APP_ROOT}/docker-compose.yml" <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 10s
      retries: 30
      start_period: 60s

  backend:
    build:
      context: ./backend
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_started
    volumes:
      - ai_index:/var/lib/danilo
      - ./models:/models:ro
    healthcheck:
      test: ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=20)\""]
      interval: 30s
      timeout: 25s
      retries: 40
      start_period: 180s

  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    profiles: ["ollama"]
    environment:
      # Concurrency: default single generation for 8 GB RAM classroom mini PCs
      OLLAMA_NUM_PARALLEL: ${OLLAMA_NUM_PARALLEL:-1}
      OLLAMA_MAX_LOADED_MODELS: ${OLLAMA_MAX_LOADED_MODELS:-1}
      # Keep the development model warm briefly, then free RAM during idle periods
      OLLAMA_KEEP_ALIVE: ${OLLAMA_KEEP_ALIVE:-5m}
      # Limit context window to reduce per-request RAM/KV-cache usage
      OLLAMA_NUM_CTX: ${OLLAMA_NUM_CTX:-1024}
      # Flash attention reduces memory for KV cache on compatible hardware
      OLLAMA_FLASH_ATTENTION: ${OLLAMA_FLASH_ATTENTION:-1}
    deploy:
      resources:
        limits:
          cpus: "2.0"
          # Gemma 3 1B/TinyLlama class + KV cache; safe for 8 GB hosts
          memory: 2048M
    volumes:
      - ollama_data:/root/.ollama
    healthcheck:
      test: ["CMD", "ollama", "list"]
      interval: 30s
      timeout: 20s
      retries: 40
      start_period: 180s

  llamacpp:
    image: ghcr.io/ggerganov/llama.cpp:server
    restart: unless-stopped
    profiles: ["llamacpp"]
    command:
      - "-m"
      - "/models/${DANILO_AI_PRIMARY_MODEL:-Phi-3-mini-4k-instruct-q4_k_m.gguf}"
      - "-c"
      - "${DANILO_AI_NUM_CTX:-1536}"
      - "-t"
      - "${DANILO_AI_THREADS:-4}"
      - "--host"
      - "0.0.0.0"
      - "--port"
      - "8080"
    volumes:
      - ./models:/models:ro
    deploy:
      resources:
        limits:
          cpus: "3.0"
          memory: 4096M

  gateway:
    build:
      context: .
      dockerfile: ./gateway/Dockerfile
      args:
        API_BASE_URL: ${API_BASE_URL:-/api}
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_started
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/opt/danilo/app/frontend/dist:ro
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    healthcheck:
      test: ["CMD-SHELL", 'test -f /opt/danilo/app/frontend/dist/index.html && test -f /opt/danilo/app/frontend/dist/danilo-build.txt && test -n "$$(find /opt/danilo/app/frontend/dist/assets -type f -name "*.js" 2>/dev/null | head -n1)" && test -n "$$(find /opt/danilo/app/frontend/dist/assets -type f -name "*.css" 2>/dev/null | head -n1)" && wget -qO- http://127.0.0.1/ | grep -Eq "/assets/.*[.]js" && wget -qO- http://127.0.0.1/ | grep -Eq "/assets/.*[.]css"']
      interval: 30s
      timeout: 20s
      retries: 30
      start_period: 120s

volumes:
  postgres_data:
  ollama_data:
  ai_index:
EOF
}

write_project_docs() {
  cat > "${APP_ROOT}/.env.example" <<'EOF'
# Project DANILO local/deployment configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
SECRET_KEY=change-me
JWT_SECRET=change-me
DATABASE_URL=
FRONTEND_URL=
API_BASE_URL=
CORS_ORIGINS=http://danilo.local,http://localhost:5173,http://127.0.0.1:5173
POSTGRES_DB=danilo
POSTGRES_USER=danilo
POSTGRES_PASSWORD=change-me
JWT_EXPIRE_MINUTES=720
COMPOSE_PROFILES=llamacpp
DANILO_AI_RUNTIME=llamacpp
LLAMA_CPP_URL=http://llamacpp:8080
OLLAMA_URL=http://ollama:11434
DANILO_OLLAMA_MODEL=phi3:mini
OLLAMA_MODEL=phi3:mini
DANILO_AI_PRIMARY_MODEL=Phi-3-mini-4k-instruct-q4_k_m.gguf
DANILO_AI_FALLBACK_MODEL=gemma-2-2b-it-q4_k_m.gguf
DANILO_AI_OPTIONAL_MODEL=
DANILO_AI_MAX_CONCURRENT=1
DANILO_AI_QUEUE_TIMEOUT_SECONDS=45
DANILO_AI_TIMEOUT_SECONDS=90
DANILO_AI_NUM_CTX=1536
DANILO_AI_THREADS=4
DANILO_AI_INDEX_PATH=/var/lib/danilo/ai_index.sqlite3
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_KEEP_ALIVE=5m
OLLAMA_FLASH_ATTENTION=1
OLLAMA_TIMEOUT_SECONDS=90
OLLAMA_NUM_CTX=1536
OLLAMA_CONTEXT_CHARS=2600
DANILO_AI_COOLDOWN_SECONDS=4
DANILO_AI_CACHE_SIZE=200
DANILO_ROLLING_MEMORY=4
DANILO_MEMORY_CHAR_BUDGET=800
DANILO_TOKENS_SHORT=140
DANILO_TOKENS_NORMAL=280
DANILO_TOKENS_DETAILED=520
SSID=PROJECT-DANILO
PORTAL_DOMAIN=danilo.local
DANILO_SEED_DEMO=0
EOF

  cat > "${APP_ROOT}/README.md" <<'EOF'
# Project DANILO

Project DANILO is an offline-first DepEd school portal packaged with FastAPI, React/Vite, PostgreSQL, Nginx, Docker Compose, llama.cpp production inference, and Ollama development fallback.

## Default Local Admin

The backend creates or repairs the first administrator during startup:

- Username: `admin`
- Password: Auto-generated on first install and shown only in the final installer summary. Change it via Settings > Account immediately after first login.
- Role: `admin`

Passwords are stored only as bcrypt hashes in `users.password_hash`. The plaintext password is printed only once in the final installer summary and is never stored in plain text or logged.

## Install, Update, And Verify

From the folder containing `danilo.sh` on Ubuntu 24.04:

```bash
sudo bash danilo.sh --install
sudo bash danilo.sh --clean-install
sudo bash danilo.sh --update
sudo bash danilo.sh --rebuild-frontend
sudo bash danilo.sh --sync
sudo bash danilo.sh --verify
```

To rebuild Docker images without cache while preserving data:

```bash
sudo bash danilo.sh --install --clean-build
```

To force a fresh database volume:

```bash
sudo DANILO_RESET_DATA=1 bash danilo.sh --clean-install
```

To add LMS demo classes and role test accounts:

```bash
sudo DANILO_SEED_DEMO=1 bash danilo.sh --install
```

Demo accounts:

- Teacher: `teacher1` / `teacher123`
- Teacher: `teacher2` / `teacher123`
- Students: `student1` through `student10` / `student123`

## Auth Flow

The frontend posts `{ "username": "...", "password": "..." }` to `/api/auth/login`. The backend validates missing fields with `400`, invalid credentials with `401`, and database/server failures with `500`. Username and email login matching are case-insensitive.

## Deployment Configuration

Copy `.env.example` to `.env` for manual deployments and override secrets before production. Use `CORS_ORIGINS`, `FRONTEND_URL`, `API_BASE_URL`, `DATABASE_URL`, and `SECRET_KEY`/`JWT_SECRET` for environment-specific settings.

## Low-Power AI Defaults

DANILO defaults to an AI-native offline classroom profile: primary `Phi-3 Mini Instruct GGUF Q4_K_M` on llama.cpp, fallback `Gemma 2 2B Q4_K_M`, and Ollama `phi3:mini` for development. Place the Phi-3 GGUF in `models/` before install.

```bash
# Use Ollama development mode if llama.cpp model files are not installed yet
sudo DANILO_AI_RUNTIME=ollama DANILO_OLLAMA_MODEL=phi3:mini bash danilo.sh --install
```

### Performance Profile (8 GB school server)

| Setting | Default | Purpose |
|---|---|---|
| `OLLAMA_NUM_PARALLEL` | `1` | Single generation keeps RAM stable under many learners |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Only one model loaded; frees RAM |
| `OLLAMA_KEEP_ALIVE` | `5m` | Unloads model after 5 min idle |
| `DANILO_AI_RUNTIME` | `llamacpp` | Production inference path with lower overhead than Ollama |
| `DANILO_AI_PRIMARY_MODEL` | `Phi-3-mini-4k-instruct-q4_k_m.gguf` | Higher-quality educational reasoning model |
| `OLLAMA_NUM_CTX` | `1536` | Small context = fast, low RAM per request |
| `OLLAMA_FLASH_ATTENTION` | `1` | Reduces KV cache memory usage |
| `DANILO_AI_MAX_CONCURRENT` | `1` | Backend fair queue matches Ollama slots |
| `DANILO_AI_QUEUE_TIMEOUT_SECONDS` | `45` | Prevents requests from waiting forever |
| `DANILO_TOKENS_SHORT` | `100` | Short mode: fastest response |
| `DANILO_TOKENS_NORMAL` | `220` | Normal mode: balanced |
| `DANILO_TOKENS_DETAILED` | `450` | Detailed mode: fuller explanation |

AI responses stream by sentence or semantic chunk so learners see progress without distracting character-by-character output. Repeated questions are served from an LRU cache without re-running inference. Lesson modules are indexed into a lightweight local SQLite retrieval store at `/var/lib/danilo/ai_index.sqlite3` so prompts include relevant class excerpts without increasing the base model size.

Use **Short** mode for fastest student help; **Detailed** only when a fuller explanation is needed.
EOF
}

validate_generated_file() {
  local path="$1"
  local label="$2"

  if [[ ! -f "${path}" ]]; then
    echo "Required generated file is missing: ${label} (${path})"
    return 1
  fi

  ok "Validated ${label}"
}

validate_gateway_files() {
  validate_generated_file "${APP_ROOT}/gateway/Dockerfile" "gateway Dockerfile"
  validate_generated_file "${APP_ROOT}/infra/nginx/default.conf" "gateway nginx config"

  if grep -Eq '^[[:space:]]*(sendfile|tcp_nopush|tcp_nodelay|keepalive_timeout)[[:space:]]' "${APP_ROOT}/infra/nginx/default.conf"; then
    echo "Gateway nginx config contains http-context directives that duplicate the base nginx image."
    return 1
  fi

  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    if docker image inspect nginx:1.27-alpine >/dev/null 2>&1; then
      if ! docker run --rm --add-host backend:127.0.0.1 \
        -v "${APP_ROOT}/infra/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
        nginx:1.27-alpine nginx -t >/dev/null; then
        echo "Gateway nginx config failed syntax validation with nginx:1.27-alpine."
        return 1
      fi
    else
      warn "Skipping nginx config syntax validation because nginx:1.27-alpine is not cached locally"
    fi
  else
    warn "Skipping nginx config syntax validation because Docker is not available"
  fi
}

validate_project_docs() {
  validate_generated_file "${APP_ROOT}/.env.example" ".env.example"
  validate_generated_file "${APP_ROOT}/README.md" "README"
}

write_systemd_units() {
  backup_managed_file /etc/systemd/system/danilo-ap.service
  cat >/etc/systemd/system/danilo-ap.service <<'EOF'
[Unit]
Description=Project DANILO Access Point and Captive Networking
After=NetworkManager.service network-online.target
Wants=network-online.target
Before=danilo-stack.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/danilo-network-up.sh
ExecStop=/usr/local/bin/danilo-network-down.sh

[Install]
WantedBy=multi-user.target
EOF

  backup_managed_file /etc/systemd/system/danilo-stack.service
  cat >/etc/systemd/system/danilo-stack.service <<EOF
[Unit]
Description=Project DANILO Application Stack
Requires=docker.service
BindsTo=docker.service
After=docker.service network-online.target
Wants=network-online.target danilo-ap.service

[Service]
Type=oneshot
RemainAfterExit=yes
Environment=COMPOSE_PROJECT_NAME=danilo
WorkingDirectory=${APP_ROOT}
ExecStart=/usr/bin/docker compose -p danilo -f ${APP_ROOT}/docker-compose.yml up -d --no-build
ExecStop=/usr/bin/docker compose -p danilo -f ${APP_ROOT}/docker-compose.yml down

[Install]
WantedBy=multi-user.target
EOF

  run_step_command "Reloading systemd units for DANILO services" systemctl daemon-reload
  run_step_command "Enabling DANILO systemd services" systemctl enable danilo-ap.service danilo-stack.service
}

# -----------------------------------------------------------------------------
# Final readiness gates and operator summary
# -----------------------------------------------------------------------------

wait_for_stack_readiness() {
  local attempts=0
  local health_body=""
  local ollama_ip=""

  note "Running final end-to-end readiness checks"
  note "Checking Docker daemon readiness"
  until docker info >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 30 ]]; then
      echo "Docker daemon did not become ready. Check: systemctl status docker"
      exit 1
    fi
    sleep 2
  done

  note "Checking compose services are running"
  wait_for_service_running postgres
  wait_for_service_running backend
  if [[ "${DANILO_AI_RUNTIME:-llamacpp}" == "llamacpp" ]]; then
    wait_for_service_running llamacpp
  elif [[ "${DANILO_AI_RUNTIME:-llamacpp}" == "ollama" ]]; then
    wait_for_service_running ollama
  fi
  wait_for_service_running gateway

  note "Checking compose health status"
  wait_for_container_healthy postgres "Postgres healthcheck"
  wait_for_container_healthy backend "Backend healthcheck"
  if [[ "${DANILO_AI_RUNTIME:-llamacpp}" == "llamacpp" ]]; then
    wait_for_service_running llamacpp
  elif [[ "${DANILO_AI_RUNTIME:-llamacpp}" == "ollama" ]]; then
    wait_for_container_healthy ollama "Ollama service readiness"
  fi
  wait_for_container_healthy gateway "Gateway/frontend healthcheck"

  note "Checking Postgres database readiness"
  attempts=0
  until docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T postgres \
    pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 30 ]]; then
      echo "Postgres is running but did not accept database connections in time."
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=80 postgres || true
      exit 1
    fi
    sleep 2
  done

  if [[ "${DANILO_AI_RUNTIME:-llamacpp}" == "ollama" ]]; then
    note "Checking Ollama API response"
    attempts=0
    until ollama_ip="$(get_container_ip ollama)" && [[ -n "${ollama_ip}" ]] && curl -fsS "http://${ollama_ip}:11434/api/tags" >/dev/null 2>&1; do
      attempts=$((attempts + 1))
      if [[ "${attempts}" -gt 30 ]]; then
        echo "Ollama is running but its API did not answer on /api/tags."
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=80 ollama || true
        exit 1
      fi
      sleep 2
    done

    note "Checking Ollama model availability"
    attempts=0
    until ollama_model_exists_in_compose "${OLLAMA_MODEL}"; do
      attempts=$((attempts + 1))
      if [[ "${attempts}" -eq 10 ]]; then
        if internet_reachable_now; then
          note "Configured model not yet present. Internet is available, so DANILO will try to pull it now."
          if ! docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T ollama ollama pull "${OLLAMA_MODEL}" >/dev/null 2>&1; then
            note "Automatic Ollama model pull did not complete yet; continuing readiness checks"
          fi
        else
          note "Configured model not yet present and internet is not reachable. Waiting for a preloaded local model."
        fi
      fi
      if [[ "${attempts}" -gt 60 ]]; then
        echo "Ollama is available, but the required local model is still missing: ${OLLAMA_MODEL}"
        echo "Reconnect temporary internet or preload this model, then re-run the installer."
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=80 ollama || true
        exit 1
      fi
      sleep 3
    done
  fi

  note "Checking backend API through gateway"
  attempts=0
  until health_body="$(curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1/api/health" 2>/dev/null)" && [[ "${health_body}" == *'"status":"ok"'* ]]; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 60 ]]; then
      echo "Backend /api/health did not return a healthy response through the gateway."
      echo "The portal is not usable yet; check backend and gateway logs below."
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=120 gateway backend || true
      exit 1
    fi
    sleep 5
  done

  note "Checking frontend HTTP response"
  attempts=0
  until curl -fsS -H "Host: ${PORTAL_DOMAIN}" "http://127.0.0.1/" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 60 ]]; then
      echo "Gateway/frontend HTTP check did not respond successfully."
      echo "The learner portal did not serve its front page on port 80."
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=120 gateway || true
      exit 1
    fi
    sleep 5
  done
}

wait_for_systemd_active() {
  local unit="$1"
  local attempts=0

  note "Checking systemd unit is active: ${unit}"
  until systemctl is-active --quiet "${unit}"; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 30 ]]; then
      echo "Systemd unit did not become active: ${unit}"
      systemctl status "${unit}" --no-pager || true
      exit 1
    fi
    sleep 2
  done
}

bring_up_offline_stack() {
  validate_generated_file "${APP_ROOT}/docker-compose.yml" "docker-compose.yml"
  note "Starting the captive portal network services"
  run_step_command "Starting DANILO captive access point service" systemctl start danilo-ap.service
  wait_for_systemd_active danilo-ap.service
  wait_for_systemd_active dnsmasq.service
  wait_for_systemd_active hostapd.service

  note "Applying Docker image tag fallback for systemd compose startup"
  docker tag danilo-backend:latest app-backend:latest || true
  docker tag danilo-gateway:latest app-gateway:latest || true

  note "Launching the offline DANILO application stack"
  run_step_command "Starting DANILO application stack service" systemctl start danilo-stack.service
  wait_for_systemd_active danilo-stack.service

  run_logged_function "wait_for_stack_readiness" wait_for_stack_readiness

  if command -v netfilter-persistent >/dev/null 2>&1; then
    if ! run_step_command "Saving DANILO firewall rules" netfilter-persistent save; then
      warn "Firewall rules could not be persisted automatically; continuing with the live rules already in memory"
    fi
  else
    skip "netfilter-persistent is not installed; skipping firewall persistence"
  fi
}
