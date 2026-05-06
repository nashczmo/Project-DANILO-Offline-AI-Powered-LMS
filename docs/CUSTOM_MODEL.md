# Custom GGUF Model

Place one `.gguf` file in:

```text
danilo-installer/models/
```

Example:

```text
danilo-installer/models/deped-tutor-q8.gguf
```

During `--install`, `--clean-install`, or `--update`, the installer detects the first `.gguf` file, resolves its absolute path, regenerates `models/Modelfile`, creates the Ollama model `danilo-custom`, and sets it as the default tutor model.

The installer log clearly prints either:

```text
Custom GGUF detected: ...
Using custom model: danilo-custom
```

or:

```text
No custom GGUF found
Using default model: qwen2.5:1.5b-instruct-q4_K_M
```

The generated Ollama model creation is equivalent to:

```bash
ollama create danilo-custom -f models/Modelfile
```

Generated Modelfile:

```text
FROM /absolute/path/to/model.gguf

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 1024

SYSTEM You are DANILO, an offline DepEd-aligned AI tutor. Explain clearly, simply, and accurately. Use lesson context when available. Do not hallucinate.
```

Install with custom model:

```bash
sudo bash danilo.sh --clean-install
```

Verify:

```bash
sudo bash danilo.sh --verify
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo exec -T ollama ollama list
sudo grep '^OLLAMA_MODEL=' /opt/danilo/app/.env
```

If the repository was edited on Windows before copying to Ubuntu, normalize shell files first:

```powershell
Get-ChildItem -File *.sh,lib\*.sh | ForEach-Object {
  $text = Get-Content -LiteralPath $_.FullName -Raw
  $text = $text -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($_.FullName, $text, [System.Text.UTF8Encoding]::new($false))
}
```

Expected active model when a GGUF exists:

```text
danilo-custom
```

If no `.gguf` file exists, DANILO uses:

```text
qwen2.5:1.5b-instruct-q4_K_M
```

Notes:

- Only the first `.gguf` file by sorted filename is registered automatically.
- The registered model name is always `danilo-custom`.
- If custom model registration fails, the installer rewrites the runtime environment to use `qwen2.5:1.5b-instruct-q4_K_M`.
- `sudo bash danilo.sh --verify` confirms the active model is loaded in Ollama.
