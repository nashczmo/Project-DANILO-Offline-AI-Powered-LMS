# Offline AI Models

Project DANILO treats AI as platform infrastructure, not a standalone chatbot. The stable deployment runtime is currently Ollama only.

## Recommended Production Models

Use the default Ollama model, or place this GGUF file in `models/` before installing on the Ubuntu server:

```text
models/microsoft_Phi-4-mini-instruct-Q4_K_M.gguf
```

Ollama runtime settings:

```env
COMPOSE_PROFILES=ollama
DANILO_AI_RUNTIME=ollama
DANILO_OLLAMA_MODEL=phi4-mini
OLLAMA_MODEL=phi4-mini
DANILO_AI_PRIMARY_MODEL=microsoft_Phi-4-mini-instruct-Q4_K_M.gguf
DANILO_AI_FALLBACK_MODEL=
DANILO_AI_NUM_CTX=1536
DANILO_AI_THREADS=4
DANILO_AI_MAX_CONCURRENT=1
```

This profile targets Intel N95, 8 GB RAM, Ubuntu Server, and offline classroom Wi-Fi usage. It favors one stable generation at a time, semantic chunk streaming, and queue feedback instead of letting requests overload the CPU.

## Stable Runtime

Ollama is the stable runtime:

```bash
sudo DANILO_OLLAMA_MODEL=phi4-mini bash danilo.sh --install
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
