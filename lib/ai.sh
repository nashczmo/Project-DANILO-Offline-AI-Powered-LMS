# Project DANILO installer module: ai.sh

DANILO_DEFAULT_OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL:-${DANILO_OLLAMA_MODEL:-llama3.1:8b-instruct-q4_K_S}}"
DANILO_CUSTOM_OLLAMA_MODEL="${DANILO_CUSTOM_OLLAMA_MODEL:-danilo-custom}"
DANILO_CUSTOM_GGUF_PATH="${DANILO_CUSTOM_GGUF_PATH:-}"
DANILO_CUSTOM_MODELFILE="${DANILO_CUSTOM_MODELFILE:-}"

configure_ollama_model() {
  local gguf_file=""
  local gguf_path=""
  local models_dir="${SCRIPT_DIR}/models"
  local modelfile="${models_dir}/Modelfile"

  mkdir -p "${models_dir}"
  gguf_file="$(find "${models_dir}" -maxdepth 1 -type f -name '*.gguf' | sort | head -n 1 || true)"

  if [[ -n "${gguf_file}" ]]; then
    echo "Custom GGUF detected: ${gguf_file}"
    gguf_path="$(realpath "${gguf_file}")"
    if [[ ! -f "${gguf_path}" ]]; then
      echo "GGUF file not found"
      exit 1
    fi

    cat > "${modelfile}" <<EOF
FROM ${gguf_path}

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 2048

SYSTEM You are DANILO, an offline DepEd-aligned AI tutor. Explain clearly, simply, and accurately. Use lesson context when available. Do not hallucinate.
EOF

    export DANILO_CUSTOM_GGUF_PATH="${gguf_path}"
    export DANILO_CUSTOM_MODELFILE="${modelfile}"
    export DANILO_OLLAMA_MODEL="${DANILO_CUSTOM_OLLAMA_MODEL}"
    OLLAMA_MODEL="${DANILO_CUSTOM_OLLAMA_MODEL}"
    echo "Using custom model: ${DANILO_CUSTOM_OLLAMA_MODEL}"
  else
    echo "No custom GGUF found"
    export DANILO_CUSTOM_GGUF_PATH=""
    export DANILO_CUSTOM_MODELFILE=""
    export DANILO_OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL}"
    OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL}"
    echo "Using default model: ${DANILO_DEFAULT_OLLAMA_MODEL}"
  fi
}

preload_ollama_model() {
  local container="$1"
  local container_models_dir="/tmp/danilo-models"

  if [[ "${OLLAMA_MODEL}" == "${DANILO_CUSTOM_OLLAMA_MODEL}" && -n "${DANILO_CUSTOM_GGUF_PATH:-}" ]]; then
    if [[ ! -f "${DANILO_CUSTOM_GGUF_PATH}" ]]; then
      echo "GGUF file not found"
      exit 1
    fi

    if ollama_model_exists_in_container "${container}" "${DANILO_CUSTOM_OLLAMA_MODEL}"; then
      echo "Custom model already exists, skipping creation"
      return 0
    fi

    run_step_command "Preparing custom GGUF model files" docker exec "${container}" mkdir -p "${container_models_dir}"
    run_step_command "Copying DANILO custom GGUF into Ollama preload container" docker cp "${DANILO_CUSTOM_GGUF_PATH}" "${container}:${container_models_dir}/custom.gguf"
    run_step_command "Writing container Modelfile for DANILO custom model" docker exec "${container}" sh -c "cat > '${container_models_dir}/Modelfile' <<'EOF'
FROM ${container_models_dir}/custom.gguf

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 2048

SYSTEM You are DANILO, an offline DepEd-aligned AI tutor. Explain clearly, simply, and accurately. Use lesson context when available. Do not hallucinate.
EOF"

    if run_step_command "Creating Ollama custom model ${DANILO_CUSTOM_OLLAMA_MODEL}" docker exec "${container}" ollama create "${DANILO_CUSTOM_OLLAMA_MODEL}" -f "${container_models_dir}/Modelfile"; then
      echo "Using custom model: ${DANILO_CUSTOM_OLLAMA_MODEL}"
      return 0
    fi

    echo "Custom GGUF could not be registered; falling back to default model"
    export DANILO_CUSTOM_GGUF_PATH=""
    export DANILO_CUSTOM_MODELFILE=""
    export DANILO_OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL}"
    OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL}"
    write_env_file
  fi

  if ollama_model_exists_in_container "${container}" "${OLLAMA_MODEL}"; then
    note "Ollama model ${OLLAMA_MODEL} is already cached; skipping pull"
  else
    run_step_command "Pulling Ollama model ${OLLAMA_MODEL}" docker exec "${container}" ollama pull "${OLLAMA_MODEL}"
  fi
}

ollama_model_exists_in_container() {
  local container="$1"
  local model="$2"
  docker exec "${container}" ollama list 2>/dev/null | awk -v model="${model}" '
    NR > 1 && ($1 == model || $1 == model ":latest") { found = 1 }
    END { exit found ? 0 : 1 }
  '
}

ollama_model_exists_in_compose() {
  local model="$1"
  docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" exec -T ollama ollama list 2>/dev/null | awk -v model="${model}" '
    NR > 1 && ($1 == model || $1 == model ":latest") { found = 1 }
    END { exit found ? 0 : 1 }
  '
}
wait_for_service_running() {
  local service="$1"
  local attempts=0
  local container_id=""
  local running=""

  note "Checking ${service} container is running"
  while true; do
    container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
    if [[ -n "${container_id}" ]]; then
      running="$(docker inspect --format '{{.State.Running}}' "${container_id}" 2>/dev/null || true)"
      [[ "${running}" == "true" ]] && return 0
    fi

    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 60 ]]; then
      echo "DANILO service did not reach running state: ${service}"
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=80 "${service}" || true
      exit 1
    fi
    sleep 3
  done
}

wait_for_container_healthy() {
  local service="$1"
  local label="$2"
  local attempts=0
  local container_id=""
  local health_status=""

  note "Checking ${label}"
  while true; do
    container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
    if [[ -n "${container_id}" ]]; then
      health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
      if [[ "${health_status}" == "healthy" ]]; then
        return 0
      fi
      if [[ "${health_status}" == "unhealthy" ]]; then
        echo "${label} reported unhealthy for service: ${service}"
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=120 "${service}" || true
        exit 1
      fi
    fi

    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 90 ]]; then
      echo "${label} did not become healthy for service: ${service}"
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=120 "${service}" || true
      exit 1
    fi
    sleep 3
  done
}

# Start the captive networking only after every required image and model asset
# is already present locally. The final compose up runs fully offline.

