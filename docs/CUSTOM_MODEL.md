# Offline AI Models

Project DANILO now treats AI as platform infrastructure, not a standalone chatbot. Production inference should run through llama.cpp with local GGUF files.

## Recommended Production Models

Place these files in `models/` before installing on the Ubuntu server:

```text
models/Phi-3-mini-4k-instruct-q4_k_m.gguf
models/gemma-2-2b-it-q4_k_m.gguf
```

Default runtime settings:

```env
DANILO_AI_RUNTIME=llamacpp
DANILO_AI_PRIMARY_MODEL=Phi-3-mini-4k-instruct-q4_k_m.gguf
DANILO_AI_FALLBACK_MODEL=gemma-2-2b-it-q4_k_m.gguf
DANILO_AI_NUM_CTX=1536
DANILO_AI_THREADS=4
DANILO_AI_MAX_CONCURRENT=1
```

This profile targets Intel N95, 8 GB RAM, Ubuntu Server, and offline classroom Wi-Fi usage. It favors one stable generation at a time, semantic chunk streaming, and queue feedback instead of letting requests overload the CPU.

## Development Mode

Ollama remains supported for development or temporary testing:

```bash
sudo DANILO_AI_RUNTIME=ollama DANILO_OLLAMA_MODEL=phi3:mini bash danilo.sh --install
```

The Ollama fallback is not the preferred production path; llama.cpp is lower overhead and easier to tune for CPU-only inference.

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

For llama.cpp mode, confirm `llamaCppOnline` is true and `modelName` matches the Phi-3 GGUF filename. For Ollama mode, confirm `ollamaOnline` is true and the configured Ollama model is present.
