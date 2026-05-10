# Project DANILO installer module: docker.sh

install_docker() {
  if command_missing docker || ! docker compose version >/dev/null 2>&1; then
    note "Installing Docker Engine and Docker Compose plugin"
    run_step_command "Creating apt keyrings directory" install -d -m 0755 /etc/apt/keyrings
    if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
      run_step_command "Downloading Docker apt signing key" curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
      run_step_command "Setting Docker signing key permissions" chmod a+r /etc/apt/keyrings/docker.asc
    fi

    backup_managed_file /etc/apt/sources.list.d/docker.list
    cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable
EOF
    run_step_command "Refreshing apt package lists for Docker" apt-get update -y -qq
    apt_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    run_step_command "Starting Docker daemon" systemctl enable --now docker
  else
    note "Docker Engine and Compose plugin already available"
  fi
}

install_node() {
  local current_major="0"
  if command -v node >/dev/null 2>&1; then
    current_major="$(node -p 'process.versions.node.split(".")[0]')"
  fi

  if [[ "${current_major}" -lt 20 ]]; then
    note "Installing Node.js LTS"
    run_step_command "Creating NodeSource keyrings directory" install -d -m 0755 /etc/apt/keyrings
    if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
      run_step_command "Downloading NodeSource signing key" curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" -o /tmp/danilo-nodesource.gpg.key
      run_step_command "Installing NodeSource signing key" gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg /tmp/danilo-nodesource.gpg.key
      run_step_command "Setting NodeSource signing key permissions" chmod a+r /etc/apt/keyrings/nodesource.gpg
      rm -f /tmp/danilo-nodesource.gpg.key
    fi
    backup_managed_file /etc/apt/sources.list.d/nodesource.list
    cat >/etc/apt/sources.list.d/nodesource.list <<EOF
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main
EOF
    run_step_command "Refreshing apt package lists for Node.js" apt-get update -y -qq
    apt_install nodejs
  else
    note "Node.js LTS already available"
  fi
}

# -----------------------------------------------------------------------------
# Cleanup, rollback, and resolver recovery
# -----------------------------------------------------------------------------

# Remove prior Project DANILO stack remnants so the install always starts clean.

install_logrotate_config() {
  backup_managed_file /etc/logrotate.d/danilo-install
  cat > /etc/logrotate.d/danilo-install <<EOF
${LOG_FILE} {
  weekly
  rotate 8
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
  create 0640 root adm
}
EOF
}

write_compose_file() {
  validate_generated_file "${APP_ROOT}/docker-compose.yml" "docker-compose.yml"
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    run_step_command "Validating Docker Compose configuration" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" config -q
  else
    skip "Docker Compose validation deferred until Docker is available"
  fi
}

prefetch_container_assets() {
  local build_args=()

  note "Starting Docker for pre-pull operations"
  run_step_command "Starting Docker for pre-pull operations" systemctl enable --now docker

  note "Pulling compose-managed service images"
  if ! run_step_command "Refreshing compose-managed service images" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" pull --ignore-pull-failures; then
    note "Some service images could not be refreshed remotely; continuing with cached images"
  fi

  note "Pulling builder base images for local Docker builds"
  docker pull python:3.12-slim >/dev/null 2>&1 || note "Using cached python:3.12-slim image"
  docker pull nginx:1.27-alpine >/dev/null 2>&1 || note "Using cached nginx:1.27-alpine image"

  if [[ "${CLEAN_BUILD}" -eq 1 ]]; then
    build_args+=(--no-cache)
    note "Running Docker build without cache"
  fi

  note "Building local application images while internet is still available"
  run_step_command "Building DANILO backend and gateway images" docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" build "${build_args[@]}" backend gateway

  note "Preloading the Ollama model into the persistent stack volume"
  run_step_command "Creating the DANILO Ollama model volume" docker volume create "${STACK_NAME}_ollama_data"
  docker rm -f "${TEMP_OLLAMA_CONTAINER}" >/dev/null 2>&1 || true
  run_step_command "Starting temporary Ollama container for model preload" docker run -d \
    --name "${TEMP_OLLAMA_CONTAINER}" \
    -v "${STACK_NAME}_ollama_data:/root/.ollama" \
    ollama/ollama:latest

  local attempts=0
  until docker exec "${TEMP_OLLAMA_CONTAINER}" ollama list >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 60 ]]; then
      echo "Temporary Ollama service did not become ready in time."
      docker logs "${TEMP_OLLAMA_CONTAINER}" || true
      exit 1
    fi
    sleep 2
  done

  preload_ollama_model "${TEMP_OLLAMA_CONTAINER}"
  docker rm -f "${TEMP_OLLAMA_CONTAINER}" >/dev/null
}

# -----------------------------------------------------------------------------
# Captive portal networking and systemd units
# -----------------------------------------------------------------------------

# Rebuild the dnsmasq master config from scratch so the daemon cannot inherit a
# stale bind address such as 10.0.0.1 from previous installs.

build_stack() {
  validate_generated_file "${APP_ROOT}/docker-compose.yml" "docker-compose.yml"
  prefetch_container_assets
}
