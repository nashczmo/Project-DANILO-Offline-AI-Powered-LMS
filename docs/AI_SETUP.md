# AI Setup Guide

Project DANILO leverages local AI to provide advanced features while maintaining a strict offline-first architecture. We use **Ollama** as the engine to serve quantized AI models directly on the host machine.

## Degraded / Offline AI Capabilities

The core design philosophy of Project DANILO is **Graceful Degradation**.
- The core LMS (Admin, Teacher, and Student portals) is completely decoupled from the AI features.
- If the AI model fails to download, or the Ollama runtime is unavailable (e.g., due to strict hardware constraints), the core LMS will **still function normally**.
- The master verification script (`sudo bash danilo.sh --verify`) will report the AI status as `[WARN] Degraded`, but the overall deployment will be considered successful.

## Feature Dependencies

Project DANILO uses AI for specific roles, which behave gracefully under degraded conditions:

### 1. Teacher AI Insights
- **Functionality:** Provides analytical summaries and insights on class performance and student metrics.
- **Dependency:** Relies heavily on structured backend database class data, passed to the AI model. If the AI is degraded, the teacher dashboard will still show raw metrics and data, but the AI-generated natural language insights will be disabled.

### 2. AI Tutor
- **Functionality:** An interactive, conversational interface for students to ask questions about course material.
- **Dependency:** Strictly depends on the local AI runtime availability (Ollama). If Ollama is down, the AI Tutor chat interface will notify the user that the tutor is temporarily offline, while all other student lessons, quizzes, and modules remain fully accessible.

## Hardware and Performance
- All AI inference runs locally without any cloud APIs. 
- Generation speed depends entirely on the host machine's hardware (CPU, RAM, and GPU if present).
- The installer automatically benchmarks the hardware during setup using `WhichLLM` to select an appropriately sized model to prevent crashing the host.
