# Offline AI Models

Project DANILO treats AI as platform infrastructure, not a standalone chatbot. The stable deployment runtime is currently Ollama only.

## Adaptive Production Models

DANILO can auto-select from a model catalog, or you can place several GGUF files in `models/` before installing on the Ubuntu server. When multiple GGUFs are present, the installer prefers the quantization that matches the detected hardware plan.

```text
models/<lightweight-or-mid-model>-Q4_0.gguf
models/<balanced-model>-Q4_K_M.gguf
models/<gpu-model>-Q5_K_M.gguf
```

Ollama runtime settings:

```env
COMPOSE_PROFILES=ollama
DANILO_AI_RUNTIME=ollama
DANILO_OLLAMA_MODEL=auto
OLLAMA_MODEL=auto
DANILO_AI_MODEL_LOW=qwen2.5:1.5b
DANILO_AI_MODEL_BALANCED=qwen2.5:3b
DANILO_AI_MODEL_GPU=llama3.1:8b
DANILO_AI_MODEL_HIGH=qwen2.5:14b
DANILO_AI_QUANTIZATION=auto
DANILO_AI_GPU_LAYERS=auto
```

The installer detects CPU model, CPU threads, RAM, storage, integrated/dedicated GPU, VRAM, CUDA, ROCm, AVX2/AVX512, Vulkan, and OpenCL signals, then writes conservative runtime settings into `/opt/danilo/app/.env`. This keeps low-end systems stable while allowing mid-range and GPU-accelerated hosts to use larger context windows, larger model families, GPU layer offload, larger batches, and more inference slots without code changes.

## Stable Runtime

Ollama is the stable runtime:

```bash
sudo bash danilo.sh --install
```

Do not enable alternate inference runtimes until the Ollama backend has been validated in classroom use.

## AI-Native Backend Flow

Every tutor request is orchestrated as:

```text
User input -> Context builder -> Curriculum retrieval -> Student learning profile -> Prompt composer -> Inference runtime -> Response formatter
```

The backend also persists a student AI profile with strengths, weak concepts, quiz signals, assignment signals, learning trends, AI interaction counts, and recommendations. The dashboard and tutor prompts can use this profile automatically, so students do not need to restate their grade, subject, lesson, or weak topics.

## Verify

After install:

```bash
sudo bash danilo.sh --verify
curl http://danilo.local/api/ai/status
```

Confirm `ollamaOnline` is true and the configured Ollama model is present.
