# Project DANILO installer module: ai.sh

DANILO_AI_MODEL_LOW="${DANILO_AI_MODEL_LOW:-}"
DANILO_AI_MODEL_BALANCED="${DANILO_AI_MODEL_BALANCED:-}"
DANILO_AI_MODEL_GPU="${DANILO_AI_MODEL_GPU:-}"
DANILO_AI_MODEL_HIGH="${DANILO_AI_MODEL_HIGH:-}"
DANILO_DEFAULT_OLLAMA_MODEL="${DANILO_DEFAULT_OLLAMA_MODEL:-${DANILO_OLLAMA_MODEL:-${DANILO_AI_MODEL_BALANCED}}}"
DANILO_FALLBACK_OLLAMA_MODEL="${DANILO_FALLBACK_OLLAMA_MODEL:-}"
DANILO_OPTIONAL_OLLAMA_MODEL="${DANILO_OPTIONAL_OLLAMA_MODEL:-}"
DANILO_AI_RUNTIME="ollama"
DANILO_AI_PRIMARY_MODEL="${DANILO_AI_PRIMARY_MODEL:-}"
DANILO_AI_FALLBACK_MODEL="${DANILO_AI_FALLBACK_MODEL:-}"
DANILO_CUSTOM_OLLAMA_MODEL="${DANILO_CUSTOM_OLLAMA_MODEL:-}"
DANILO_CUSTOM_GGUF_PATH="${DANILO_CUSTOM_GGUF_PATH:-}"
DANILO_CUSTOM_MODELFILE="${DANILO_CUSTOM_MODELFILE:-}"

_danilo_first_line() {
  awk 'NF {print; exit}' 2>/dev/null || true
}

_danilo_detect_cpu_model() {
  if command -v lscpu >/dev/null 2>&1; then
    lscpu 2>/dev/null | awk -F: '/Model name/ {gsub(/^[ \t]+/, "", $2); print $2; exit}'
  elif [[ -r /proc/cpuinfo ]]; then
    awk -F: '/model name|Hardware/ {gsub(/^[ \t]+/, "", $2); print $2; exit}' /proc/cpuinfo 2>/dev/null
  fi
}

_danilo_cpu_has_flag() {
  local flag="$1"
  grep -qiE "(^|[[:space:]])${flag}([[:space:]]|$)" /proc/cpuinfo 2>/dev/null
}

_danilo_lspci_matches() {
  local pattern="$1"
  command -v lspci >/dev/null 2>&1 && lspci 2>/dev/null | grep -Eiq "${pattern}"
}

detect_ai_hardware_profile() {
  local mem_kb mem_mb cpu_count gpu_vram_mb profile storage_available_mb
  local cpu_model integrated_gpu dedicated_gpu gpu_name cuda_supported rocm_supported avx2_supported avx512_supported vulkan_supported opencl_supported
  local model_overridden selected_model selected_fallback selected_optional model_class quantization num_gpu num_batch kv_cache scheduler low_vram
  mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
  [[ "${mem_kb}" =~ ^[0-9]+$ ]] || mem_kb=0
  mem_mb=$((mem_kb / 1024))
  cpu_count="$(nproc 2>/dev/null || echo 2)"
  [[ "${cpu_count}" =~ ^[0-9]+$ ]] || cpu_count=2
  cpu_model="$(_danilo_detect_cpu_model | _danilo_first_line)"
  cpu_model="${cpu_model:-unknown}"
  storage_available_mb="$(df -Pm "${PROJECT_ROOT:-/}" 2>/dev/null | awk 'NR == 2 {print int($4)}')"
  [[ "${storage_available_mb}" =~ ^[0-9]+$ ]] || storage_available_mb=0

  gpu_vram_mb=0
  gpu_name=""
  cuda_supported=0
  rocm_supported=0
  integrated_gpu=0
  dedicated_gpu=0
  vulkan_supported=0
  opencl_supported=0

  if command -v nvidia-smi >/dev/null 2>&1; then
    gpu_vram_mb="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | awk 'NR == 1 {print int($1)}' || echo 0)"
    gpu_name="$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | awk 'NR == 1 {print}' || true)"
    cuda_supported=1
    dedicated_gpu=1
  fi
  [[ "${gpu_vram_mb}" =~ ^[0-9]+$ ]] || gpu_vram_mb=0
  if _danilo_lspci_matches 'VGA|3D|Display'; then
    _danilo_lspci_matches 'Intel.*(VGA|3D|Display)|(VGA|3D|Display).*Intel' && integrated_gpu=1
    _danilo_lspci_matches 'AMD|ATI|NVIDIA' && dedicated_gpu=1
    if [[ -z "${gpu_name}" ]]; then
      gpu_name="$(lspci 2>/dev/null | awk '/VGA|3D|Display/ {sub(/^[^:]+: /, ""); print; exit}')"
    fi
  fi
  if command -v rocm-smi >/dev/null 2>&1 || command -v rocminfo >/dev/null 2>&1; then
    if _danilo_lspci_matches 'AMD|ATI'; then
      rocm_supported=1
      dedicated_gpu=1
    fi
  fi
  if command -v vulkaninfo >/dev/null 2>&1 || [[ -d /usr/share/vulkan/icd.d ]]; then
    vulkan_supported=1
  fi
  if command -v clinfo >/dev/null 2>&1 || [[ -d /etc/OpenCL/vendors ]]; then
    opencl_supported=1
  fi
  _danilo_cpu_has_flag avx2 && avx2_supported=1 || avx2_supported=0
  _danilo_cpu_has_flag 'avx512' && avx512_supported=1 || avx512_supported=0

  DANILO_AI_RAM_MB="${DANILO_AI_RAM_MB:-${mem_mb}}"
  DANILO_AI_CPU_COUNT="${DANILO_AI_CPU_COUNT:-${cpu_count}}"
  DANILO_AI_GPU_VRAM_MB="${DANILO_AI_GPU_VRAM_MB:-${gpu_vram_mb}}"
  DANILO_AI_CPU_MODEL="${DANILO_AI_CPU_MODEL:-${cpu_model}}"
  DANILO_AI_GPU_NAME="${DANILO_AI_GPU_NAME:-${gpu_name:-none}}"
  DANILO_AI_INTEGRATED_GPU="${DANILO_AI_INTEGRATED_GPU:-${integrated_gpu}}"
  DANILO_AI_DEDICATED_GPU="${DANILO_AI_DEDICATED_GPU:-${dedicated_gpu}}"
  DANILO_AI_CUDA="${DANILO_AI_CUDA:-${cuda_supported}}"
  DANILO_AI_ROCM="${DANILO_AI_ROCM:-${rocm_supported}}"
  DANILO_AI_AVX2="${DANILO_AI_AVX2:-${avx2_supported}}"
  DANILO_AI_AVX512="${DANILO_AI_AVX512:-${avx512_supported}}"
  DANILO_AI_VULKAN="${DANILO_AI_VULKAN:-${vulkan_supported}}"
  DANILO_AI_OPENCL="${DANILO_AI_OPENCL:-${opencl_supported}}"
  DANILO_AI_STORAGE_AVAILABLE_MB="${DANILO_AI_STORAGE_AVAILABLE_MB:-${storage_available_mb}}"

  local ai_concurrency_overridden=0
  local ollama_parallel_overridden=0
  local ctx_overridden=0
  local keep_alive_overridden=0
  local timeout_overridden=0
  local context_chars_overridden=0
  local threads_overridden=0
  local batch_overridden=0
  local gpu_layers_overridden=0
  [[ -n "${DANILO_AI_MAX_CONCURRENT:-}" ]] && ai_concurrency_overridden=1
  [[ -n "${OLLAMA_NUM_PARALLEL:-}" ]] && ollama_parallel_overridden=1
  [[ -n "${OLLAMA_NUM_CTX:-}${DANILO_AI_NUM_CTX:-}" ]] && ctx_overridden=1
  [[ -n "${OLLAMA_KEEP_ALIVE:-}" ]] && keep_alive_overridden=1
  [[ -n "${OLLAMA_TIMEOUT_SECONDS:-}${DANILO_AI_TIMEOUT_SECONDS:-}" ]] && timeout_overridden=1
  [[ -n "${OLLAMA_CONTEXT_CHARS:-}" ]] && context_chars_overridden=1
  [[ -n "${DANILO_AI_THREADS:-}" ]] && threads_overridden=1
  [[ -n "${OLLAMA_NUM_BATCH:-}" ]] && batch_overridden=1
  [[ -n "${OLLAMA_NUM_GPU:-}${DANILO_AI_GPU_LAYERS:-}" ]] && gpu_layers_overridden=1

  DANILO_AI_RUNTIME="ollama"

  local ram_high="${DANILO_RAM_HIGH_THRESHOLD:-65536}"
  local ram_mid="${DANILO_RAM_MID_THRESHOLD:-32768}"

  if (( mem_mb >= ram_high && dedicated_gpu == 1 )); then
    profile="high"
  elif (( mem_mb < ram_mid && dedicated_gpu == 0 && integrated_gpu == 0 )); then
    profile="low"
  else
    profile="mid"
  fi

  case "${profile}" in
    high)
      selected_model="${DANILO_AI_MODEL_HIGH}"
      selected_fallback="${DANILO_AI_MODEL_MID}"
      selected_optional=""
      model_class="large"
      quantization="${DANILO_AI_QUANTIZATION:-q5_K_M}"
      num_gpu=999
      num_batch=512
      kv_cache="${OLLAMA_KV_CACHE_TYPE:-f16}"
      scheduler="gpu-throughput"
      [[ "${ai_concurrency_overridden}" -eq 0 ]] && DANILO_AI_MAX_CONCURRENT=3
      [[ "${ollama_parallel_overridden}" -eq 0 ]] && OLLAMA_NUM_PARALLEL=3
      [[ "${ctx_overridden}" -eq 0 ]] && OLLAMA_NUM_CTX=4096
      [[ "${keep_alive_overridden}" -eq 0 ]] && OLLAMA_KEEP_ALIVE=20m
      [[ "${timeout_overridden}" -eq 0 ]] && OLLAMA_TIMEOUT_SECONDS=120
      [[ "${context_chars_overridden}" -eq 0 ]] && OLLAMA_CONTEXT_CHARS=5600
      ;;
    mid)
      selected_model="${DANILO_AI_MODEL_MID}"
      selected_fallback="${DANILO_AI_MODEL_LOW}"
      selected_optional=""
      model_class="mid-cpu"
      quantization="${DANILO_AI_QUANTIZATION:-q4_K_M}"
      num_gpu=$(( dedicated_gpu == 1 ? 999 : 0 ))
      num_batch=256
      kv_cache="${OLLAMA_KV_CACHE_TYPE:-q8_0}"
      scheduler="fair-queue"
      [[ "${ai_concurrency_overridden}" -eq 0 ]] && DANILO_AI_MAX_CONCURRENT=2
      [[ "${ollama_parallel_overridden}" -eq 0 ]] && OLLAMA_NUM_PARALLEL=2
      [[ "${ctx_overridden}" -eq 0 ]] && OLLAMA_NUM_CTX=2048
      [[ "${keep_alive_overridden}" -eq 0 ]] && OLLAMA_KEEP_ALIVE=10m
      [[ "${timeout_overridden}" -eq 0 ]] && OLLAMA_TIMEOUT_SECONDS=150
      [[ "${context_chars_overridden}" -eq 0 ]] && OLLAMA_CONTEXT_CHARS=3000
      ;;
    low|*)
      selected_model="${DANILO_AI_MODEL_LOW}"
      selected_fallback=""
      selected_optional=""
      model_class="lightweight"
      quantization="${DANILO_AI_QUANTIZATION:-q4_0}"
      num_gpu=0
      num_batch=128
      kv_cache="${OLLAMA_KV_CACHE_TYPE:-q8_0}"
      scheduler="low-memory-fair-queue"
      [[ "${ai_concurrency_overridden}" -eq 0 ]] && DANILO_AI_MAX_CONCURRENT=1
      [[ "${ollama_parallel_overridden}" -eq 0 ]] && OLLAMA_NUM_PARALLEL=1
      [[ "${ctx_overridden}" -eq 0 ]] && OLLAMA_NUM_CTX=1024
      [[ "${keep_alive_overridden}" -eq 0 ]] && OLLAMA_KEEP_ALIVE=2m
      [[ "${timeout_overridden}" -eq 0 ]] && OLLAMA_TIMEOUT_SECONDS=180
      [[ "${context_chars_overridden}" -eq 0 ]] && OLLAMA_CONTEXT_CHARS=1800
      warn "Detected constrained hardware (${mem_mb} MB RAM, ${cpu_count} CPU threads). DANILO will favor queue stability and shorter AI contexts."
      ;;
  esac

  if (( avx2_supported == 0 && cuda_supported == 0 && rocm_supported == 0 )); then
    selected_model="${DANILO_AI_MODEL_LOW}"
    selected_fallback=""
    selected_optional=""
    model_class="lightweight"
    quantization="${DANILO_AI_QUANTIZATION:-q4_0}"
    [[ "${ctx_overridden}" -eq 0 ]] && OLLAMA_NUM_CTX=1024
    [[ "${ollama_parallel_overridden}" -eq 0 ]] && OLLAMA_NUM_PARALLEL=1
    [[ "${ai_concurrency_overridden}" -eq 0 ]] && DANILO_AI_MAX_CONCURRENT=1
    scheduler="compatibility-cpu"
  fi

  if (( storage_available_mb > 0 && storage_available_mb < 8192 )); then
    selected_model="${DANILO_AI_MODEL_LOW}"
    selected_fallback=""
    selected_optional=""
    model_class="lightweight"
    quantization="${DANILO_AI_QUANTIZATION:-q4_0}"
    warn "Detected limited storage (${storage_available_mb} MB free). DANILO will select a lightweight model plan."
  fi

  model_overridden=0
  if [[ "${DANILO_MODEL_AUTO_SELECT:-1}" == "0" ]]; then
    model_overridden=1
  elif [[ -n "${DANILO_OLLAMA_MODEL:-}" && "${DANILO_OLLAMA_MODEL}" != "auto" ]]; then
    model_overridden=1
  fi
  if (( model_overridden == 0 )); then
    DANILO_DEFAULT_OLLAMA_MODEL="${selected_model}"
    OLLAMA_MODEL="${selected_model}"
    DANILO_OLLAMA_MODEL="${selected_model}"
  else
    OLLAMA_MODEL="${DANILO_OLLAMA_MODEL:-${OLLAMA_MODEL:-${selected_model}}}"
  fi
  DANILO_FALLBACK_OLLAMA_MODEL="${DANILO_FALLBACK_OLLAMA_MODEL:-${selected_fallback}}"
  DANILO_OPTIONAL_OLLAMA_MODEL="${DANILO_OPTIONAL_OLLAMA_MODEL:-${selected_optional}}"
  DANILO_AI_FALLBACK_MODEL="${DANILO_AI_FALLBACK_MODEL:-${DANILO_FALLBACK_OLLAMA_MODEL}}"
  DANILO_AI_OPTIONAL_MODEL="${DANILO_AI_OPTIONAL_MODEL:-${DANILO_OPTIONAL_OLLAMA_MODEL}}"

  [[ "${threads_overridden}" -eq 0 ]] && DANILO_AI_THREADS="$(( cpu_count > 8 ? 8 : cpu_count ))"
  if ! [[ "${DANILO_AI_THREADS}" =~ ^[0-9]+$ ]] || (( DANILO_AI_THREADS < 1 )); then
    DANILO_AI_THREADS=1
  fi
  if [[ "${batch_overridden}" -eq 0 ]]; then
    OLLAMA_NUM_BATCH="${num_batch}"
  fi
  if [[ "${gpu_layers_overridden}" -eq 0 ]]; then
    OLLAMA_NUM_GPU="${num_gpu}"
    DANILO_AI_GPU_LAYERS="${num_gpu}"
  fi
  OLLAMA_MAX_LOADED_MODELS="${OLLAMA_MAX_LOADED_MODELS:-1}"
  OLLAMA_FLASH_ATTENTION="${OLLAMA_FLASH_ATTENTION:-1}"
  OLLAMA_KV_CACHE_TYPE="${OLLAMA_KV_CACHE_TYPE:-${kv_cache}}"
  DANILO_AI_QUANTIZATION="${DANILO_AI_QUANTIZATION:-${quantization}}"
  DANILO_AI_MODEL_CLASS="${DANILO_AI_MODEL_CLASS:-${model_class}}"
  DANILO_AI_SCHEDULER="${DANILO_AI_SCHEDULER:-${scheduler}}"
  DANILO_AI_LOW_VRAM=0
  if (( gpu_vram_mb > 0 && gpu_vram_mb < 8192 )); then
    DANILO_AI_LOW_VRAM=1
  fi
  DANILO_AI_TIMEOUT_SECONDS="${DANILO_AI_TIMEOUT_SECONDS:-${OLLAMA_TIMEOUT_SECONDS}}"
  DANILO_AI_NUM_CTX="${DANILO_AI_NUM_CTX:-${OLLAMA_NUM_CTX}}"
  DANILO_AI_HARDWARE_PROFILE="${DANILO_AI_HARDWARE_PROFILE:-${profile}}"

  export DANILO_AI_RAM_MB DANILO_AI_CPU_COUNT DANILO_AI_GPU_VRAM_MB DANILO_AI_HARDWARE_PROFILE DANILO_AI_CPU_MODEL DANILO_AI_GPU_NAME
  export DANILO_AI_INTEGRATED_GPU DANILO_AI_DEDICATED_GPU DANILO_AI_CUDA DANILO_AI_ROCM DANILO_AI_AVX2 DANILO_AI_AVX512 DANILO_AI_VULKAN DANILO_AI_OPENCL DANILO_AI_STORAGE_AVAILABLE_MB
  export DANILO_AI_MAX_CONCURRENT DANILO_AI_RUNTIME DANILO_AI_PRIMARY_MODEL DANILO_AI_FALLBACK_MODEL DANILO_AI_OPTIONAL_MODEL DANILO_AI_TIMEOUT_SECONDS DANILO_AI_NUM_CTX DANILO_AI_THREADS
  export DANILO_AI_QUANTIZATION DANILO_AI_MODEL_CLASS DANILO_AI_SCHEDULER DANILO_AI_GPU_LAYERS DANILO_AI_LOW_VRAM
  export DANILO_OLLAMA_MODEL OLLAMA_MODEL DANILO_FALLBACK_OLLAMA_MODEL DANILO_OPTIONAL_OLLAMA_MODEL
  export OLLAMA_NUM_PARALLEL OLLAMA_MAX_LOADED_MODELS OLLAMA_NUM_CTX OLLAMA_KEEP_ALIVE OLLAMA_TIMEOUT_SECONDS OLLAMA_CONTEXT_CHARS OLLAMA_FLASH_ATTENTION OLLAMA_NUM_BATCH OLLAMA_NUM_GPU OLLAMA_KV_CACHE_TYPE
  note "AI hardware profile: profile=${DANILO_AI_HARDWARE_PROFILE} model=${OLLAMA_MODEL} class=${DANILO_AI_MODEL_CLASS} quant=${DANILO_AI_QUANTIZATION} RAM=${DANILO_AI_RAM_MB}MB CPU=${DANILO_AI_CPU_COUNT} GPU=${DANILO_AI_GPU_NAME} VRAM=${DANILO_AI_GPU_VRAM_MB}MB CUDA=${DANILO_AI_CUDA} ROCm=${DANILO_AI_ROCM} AVX2=${DANILO_AI_AVX2} ctx=${OLLAMA_NUM_CTX} gpu_layers=${OLLAMA_NUM_GPU} batch=${OLLAMA_NUM_BATCH}"
}

configure_ollama_model() {
  detect_ai_hardware_profile
  local models_dir="${SCRIPT_DIR}/models"
  local gguf_file=""
  local custom_model_name="${DANILO_CUSTOM_OLLAMA_MODEL:-danilo-local}"

  mkdir -p "${models_dir}"

  # WhichLLM Dynamic hardware-aware AI model selection
  if command_missing whichllm; then
    if command -v pip3 >/dev/null 2>&1 && internet_reachable_now; then
      note "Internet and pip3 detected. Installing whichllm for dynamic hardware AI benchmarking..."
      pip3 install --break-system-packages whichllm >/dev/null 2>&1 || true
    fi
  fi

  if command -v whichllm >/dev/null 2>&1 || python3 -m whichllm --version >/dev/null 2>&1; then
    note "Running whichllm to benchmark hardware and recommend the best model..."
    local best_model=""
    # Fallback execution in case 'whichllm' is not in PATH but accessible via python module
    local whichllm_cmd="whichllm"
    if command_missing whichllm; then
      whichllm_cmd="python3 -m whichllm"
    fi
    
    # Run whichllm and try to parse the best model from the JSON output array
    best_model="$(${whichllm_cmd} --json 2>/dev/null | jq -r '.[0] | .ollama_model // .model // .name // .id // .repo_id' 2>/dev/null | sed 's/ gguf//gi' | sed 's/ .*//g' || true)"
    
    if [[ -n "${best_model}" && "${best_model}" != "null" ]]; then
      ok "WhichLLM dynamically selected the optimal model: ${best_model}"
      DANILO_DEFAULT_OLLAMA_MODEL="${best_model}"
      OLLAMA_MODEL="${best_model}"
      DANILO_OLLAMA_MODEL="${best_model}"
    else
      warn "WhichLLM did not return a valid model name; falling back to conservative static plan (${DANILO_DEFAULT_OLLAMA_MODEL})"
    fi
  fi

  if [[ -n "${DANILO_CUSTOM_GGUF_PATH:-}" && -f "${DANILO_CUSTOM_GGUF_PATH}" ]]; then
    gguf_file="${DANILO_CUSTOM_GGUF_PATH}"
  else
    gguf_file="$(find "${models_dir}" -maxdepth 1 -type f -iname '*.gguf' | sort | head -n1 || true)"
  fi

  if [[ -n "${gguf_file}" ]]; then
    note "Local GGUF model detected; configuring Ollama model name: ${custom_model_name}"
    OLLAMA_MODEL="${custom_model_name}"
    DANILO_OLLAMA_MODEL="${custom_model_name}"
  fi

  export OLLAMA_MODEL DANILO_OLLAMA_MODEL
}

preload_ollama_model() {
  local container="$1"
  local embed_model="${DANILO_AI_EMBEDDING_MODEL:-nomic-embed-text}"
  local gguf_file=""
  local custom_model_name="${DANILO_CUSTOM_OLLAMA_MODEL:-danilo-local}"
  local modelfile=""

  if [[ -n "${DANILO_CUSTOM_GGUF_PATH:-}" && -f "${DANILO_CUSTOM_GGUF_PATH}" ]]; then
    gguf_file="${DANILO_CUSTOM_GGUF_PATH}"
  else
    gguf_file="$(find "${SCRIPT_DIR}/models" -maxdepth 1 -type f -iname '*.gguf' | sort | head -n1 || true)"
  fi

  if [[ -n "${gguf_file}" ]]; then
    note "Registering local GGUF model with Ollama: ${gguf_file}"
    modelfile="$(mktemp)"
    if [[ -n "${DANILO_CUSTOM_MODELFILE:-}" && -f "${DANILO_CUSTOM_MODELFILE}" ]]; then
      cp "${DANILO_CUSTOM_MODELFILE}" "${modelfile}"
    else
      printf 'FROM /models/%s\n' "$(basename "${gguf_file}")" > "${modelfile}"
    fi
    docker exec "${container}" mkdir -p /models
    docker cp "${modelfile}" "${container}:/tmp/DANILO-Modelfile"
    docker cp "${gguf_file}" "${container}:/models/$(basename "${gguf_file}")"
    if ! run_step_command "Creating Ollama model ${custom_model_name} from local GGUF" docker exec "${container}" ollama create "${custom_model_name}" -f /tmp/DANILO-Modelfile; then
      warn "Local GGUF model could not be registered; the LMS will continue with degraded AI."
    fi
    rm -f "${modelfile}"
    OLLAMA_MODEL="${custom_model_name}"
    DANILO_OLLAMA_MODEL="${custom_model_name}"
  fi

  if ollama_model_exists_in_container "${container}" "${OLLAMA_MODEL}"; then
    note "Ollama model ${OLLAMA_MODEL} is already cached; skipping pull"
  elif ! run_step_command "Pulling Ollama model ${OLLAMA_MODEL}" timeout "${DANILO_MODEL_PULL_TIMEOUT_SECONDS:-3600}" docker exec "${container}" ollama pull "${OLLAMA_MODEL}"; then
    warn "Primary Ollama model ${OLLAMA_MODEL} could not be loaded; the core LMS will continue with degraded AI."
  fi
  if [[ -n "${DANILO_FALLBACK_OLLAMA_MODEL}" && "${DANILO_FALLBACK_OLLAMA_MODEL}" != "${OLLAMA_MODEL}" ]]; then
    if ollama_model_exists_in_container "${container}" "${DANILO_FALLBACK_OLLAMA_MODEL}"; then
      note "Fallback model ${DANILO_FALLBACK_OLLAMA_MODEL} is already cached; skipping pull"
    else
      timeout "${DANILO_MODEL_PULL_TIMEOUT_SECONDS:-3600}" docker exec "${container}" ollama pull "${DANILO_FALLBACK_OLLAMA_MODEL}" || note "Fallback model ${DANILO_FALLBACK_OLLAMA_MODEL} could not be pulled; primary model remains available"
    fi
  fi
  if ollama_model_exists_in_container "${container}" "${embed_model}"; then
    note "Embeddings model ${embed_model} is already cached; skipping pull"
  elif ! run_step_command "Pulling Embeddings model ${embed_model}" timeout "${DANILO_MODEL_PULL_TIMEOUT_SECONDS:-3600}" docker exec "${container}" ollama pull "${embed_model}"; then
    warn "Embeddings model ${embed_model} could not be loaded; retrieval-enhanced AI will be degraded."
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
  local fatal="${2:-1}"
  local max_attempts="${3:-60}"
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
    if [[ "${attempts}" -gt "${max_attempts}" ]]; then
      echo "DANILO service did not reach running state: ${service}"
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=80 "${service}" || true
      if [[ "${fatal}" -eq 1 ]]; then
        exit 1
      fi
      return 1
    fi
    sleep 3
  done
}

wait_for_container_healthy() {
  local service="$1"
  local label="$2"
  local fatal="${3:-1}"
  local max_attempts="${4:-180}"
  local attempts=0
  local container_id=""
  local health_status=""
  local unhealthy_consecutive=0
  local restarts=0

  note "Checking ${label}"
  while true; do
    container_id="$(docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps -q "${service}" 2>/dev/null | head -n1 || true)"
    if [[ -n "${container_id}" ]]; then
      health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
      if [[ "${health_status}" == "healthy" || "${health_status}" == "running" ]]; then
        return 0
      fi
      if [[ "${health_status}" == "unhealthy" || "${health_status}" == "exited" ]]; then
        unhealthy_consecutive=$(( unhealthy_consecutive + 1 ))
        warn "${label} reported ${health_status} for service: ${service} (consecutive: ${unhealthy_consecutive})"
        docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=40 "${service}" || true
        docker inspect --format '{{if .State.Health}}{{range .State.Health.Log}}{{println .End "exit=" .ExitCode}}{{println .Output}}{{end}}{{end}}' "${container_id}" 2>/dev/null || true
        
        # Self-healing: if container is exited or unhealthy for 10 attempts (~30 seconds), try to restart it
        if (( unhealthy_consecutive >= 10 )) || [[ "${health_status}" == "exited" ]]; then
          if (( restarts < 3 )); then
            restarts=$(( restarts + 1 ))
            unhealthy_consecutive=0
            note_status "REPAIR" "Self-healing: Restarting failed or unhealthy container for ${service} (Attempt ${restarts}/3)..."
            docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" restart "${service}" || true
            sleep 5
            continue
          fi
        fi
      else
        unhealthy_consecutive=0
      fi
    fi

    attempts=$((attempts + 1))
    if [[ "${attempts}" -gt "${max_attempts}" ]]; then
      echo "${label} did not become healthy for service: ${service}"
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" ps || true
      docker compose -f "${APP_ROOT}/docker-compose.yml" -p "${STACK_NAME}" logs --tail=120 "${service}" || true
      if [[ "${fatal}" -eq 1 ]]; then
        exit 1
      fi
      return 1
    fi
    sleep 3
  done
}

# Start the captive networking only after every required image and model asset
# is already present locally. The final compose up runs fully offline.
