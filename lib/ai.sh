# Project DANILO installer module: ai.sh

DANILO_DEFAULT_OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL:-${DANILO_OLLAMA_MODEL:-phi3:mini}}"
DANILO_FALLBACK_OLLAMA_MODEL="${DANILO_FALLBACK_OLLAMA_MODEL:-gemma2:2b}"
DANILO_OPTIONAL_OLLAMA_MODEL="${DANILO_OPTIONAL_OLLAMA_MODEL:-}"
DANILO_AI_RUNTIME="${DANILO_AI_RUNTIME:-llamacpp}"
DANILO_AI_PRIMARY_MODEL="${DANILO_AI_PRIMARY_MODEL:-Phi-3-mini-4k-instruct-q4_k_m.gguf}"
DANILO_AI_FALLBACK_MODEL="${DANILO_AI_FALLBACK_MODEL:-gemma-2-2b-it-q4_k_m.gguf}"
DANILO_CUSTOM_OLLAMA_MODEL="${DANILO_CUSTOM_OLLAMA_MODEL:-danilo-custom}"
DANILO_CUSTOM_GGUF_PATH="${DANILO_CUSTOM_GGUF_PATH:-}"
DANILO_CUSTOM_MODELFILE="${DANILO_CUSTOM_MODELFILE:-}"

detect_ai_hardware_profile() {
  local mem_kb mem_mb cpu_count
  mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  mem_mb=$((mem_kb / 1024))
  cpu_count="$(nproc 2>/dev/null || echo 2)"
  DANILO_AI_RAM_MB="${DANILO_AI_RAM_MB:-${mem_mb}}"
  DANILO_AI_CPU_COUNT="${DANILO_AI_CPU_COUNT:-${cpu_count}}"
  local ai_concurrency_overridden=0
  local ollama_parallel_overridden=0
  [[ -n "${DANILO_AI_MAX_CONCURRENT:-}" ]] && ai_concurrency_overridden=1
  [[ -n "${OLLAMA_NUM_PARALLEL:-}" ]] && ollama_parallel_overridden=1
  DANILO_AI_MAX_CONCURRENT="${DANILO_AI_MAX_CONCURRENT:-1}"
  OLLAMA_NUM_PARALLEL="${OLLAMA_NUM_PARALLEL:-1}"
  OLLAMA_MAX_LOADED_MODELS="${OLLAMA_MAX_LOADED_MODELS:-1}"
  OLLAMA_NUM_CTX="${OLLAMA_NUM_CTX:-1536}"
  OLLAMA_KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:-5m}"
  OLLAMA_TIMEOUT_SECONDS="${OLLAMA_TIMEOUT_SECONDS:-90}"
  OLLAMA_CONTEXT_CHARS="${OLLAMA_CONTEXT_CHARS:-1600}"

  if [[ "${mem_mb}" -lt 6144 ]]; then
    warn "Detected ${mem_mb} MB RAM. DANILO will use single-request AI mode; use Q4_K_M Phi-3 Mini or Gemma 2 2B only."
  elif [[ "${mem_mb}" -ge 12288 && "${DANILO_ALLOW_AI_PARALLEL:-0}" == "1" ]]; then
    [[ "${ai_concurrency_overridden}" -eq 0 ]] && DANILO_AI_MAX_CONCURRENT=2
    [[ "${ollama_parallel_overridden}" -eq 0 ]] && OLLAMA_NUM_PARALLEL=2
  fi

  export DANILO_AI_RAM_MB DANILO_AI_CPU_COUNT DANILO_AI_MAX_CONCURRENT DANILO_AI_RUNTIME DANILO_AI_PRIMARY_MODEL DANILO_AI_FALLBACK_MODEL
  export OLLAMA_NUM_PARALLEL OLLAMA_MAX_LOADED_MODELS OLLAMA_NUM_CTX OLLAMA_KEEP_ALIVE OLLAMA_TIMEOUT_SECONDS OLLAMA_CONTEXT_CHARS
  note "AI hardware profile: runtime=${DANILO_AI_RUNTIME} primary=${DANILO_AI_PRIMARY_MODEL} RAM=${DANILO_AI_RAM_MB}MB CPU=${DANILO_AI_CPU_COUNT} concurrent=${DANILO_AI_MAX_CONCURRENT} ctx=${OLLAMA_NUM_CTX}"
}

configure_ollama_model() {
  detect_ai_hardware_profile
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

    if [[ "${DANILO_AI_RUNTIME}" == "llamacpp" && ! -f "${models_dir}/${DANILO_AI_PRIMARY_MODEL}" ]]; then
      export DANILO_AI_PRIMARY_MODEL="$(basename "${gguf_file}")"
      echo "Using llama.cpp primary GGUF: ${DANILO_AI_PRIMARY_MODEL}"
    fi

    cat > "${modelfile}" <<EOF
FROM ${gguf_path}

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 1024
PARAMETER num_predict 220

SYSTEM You are DANILO, an offline DepEd AI tutor for Filipino students (Grades 1-12). Be clear, concise, and accurate. Use lesson context when provided. Never guess or hallucinate. Rules: No violent, sexual, or harmful content. Redirect off-topic questions politely. Tone: encouraging, age-appropriate, patient.
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
PARAMETER num_ctx 1024
PARAMETER num_predict 220

SYSTEM You are DANILO, an offline DepEd AI tutor for Filipino students (Grades 1-12). Be clear, concise, and accurate. Use lesson context when provided. Never guess or hallucinate. Rules: No violent, sexual, or harmful content. Redirect off-topic questions politely. Tone: encouraging, age-appropriate, patient.
EOF"

    if run_step_command "Creating Ollama custom model ${DANILO_CUSTOM_OLLAMA_MODEL}" docker exec "${container}" ollama create "${DANILO_CUSTOM_OLLAMA_MODEL}" -f "${container_models_dir}/Modelfile"; then
      echo "Using custom model: ${DANILO_CUSTOM_OLLAMA_MODEL}"
      if [[ -n "${DANILO_FALLBACK_OLLAMA_MODEL}" && "${DANILO_FALLBACK_OLLAMA_MODEL}" != "${DANILO_CUSTOM_OLLAMA_MODEL}" ]]; then
        docker exec "${container}" ollama pull "${DANILO_FALLBACK_OLLAMA_MODEL}" || note "Fallback model ${DANILO_FALLBACK_OLLAMA_MODEL} could not be pulled; continuing with custom model only"
      fi
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
  if [[ -n "${DANILO_FALLBACK_OLLAMA_MODEL}" && "${DANILO_FALLBACK_OLLAMA_MODEL}" != "${OLLAMA_MODEL}" ]]; then
    if ollama_model_exists_in_container "${container}" "${DANILO_FALLBACK_OLLAMA_MODEL}"; then
      note "Fallback model ${DANILO_FALLBACK_OLLAMA_MODEL} is already cached; skipping pull"
    else
      docker exec "${container}" ollama pull "${DANILO_FALLBACK_OLLAMA_MODEL}" || note "Fallback model ${DANILO_FALLBACK_OLLAMA_MODEL} could not be pulled; primary model remains available"
    fi
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
        warn "${label} reported unhealthy for service: ${service}; continuing to wait because low-power CPU startup can be slow"
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=40 "${service}" || true
      fi
    fi

    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt 180 ]]; then
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
