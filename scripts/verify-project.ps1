param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$failed = $false

function Pass($Message) {
  Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Fail($Message) {
  Write-Host "[FAIL] $Message" -ForegroundColor Red
  $script:failed = $true
}

function Require-File($Path, $Label) {
  $full = Join-Path $Root $Path
  if (Test-Path -LiteralPath $full -PathType Leaf) { Pass $Label } else { Fail "$Label missing: $Path" }
}

function Require-Dir($Path, $Label) {
  $full = Join-Path $Root $Path
  if (Test-Path -LiteralPath $full -PathType Container) { Pass $Label } else { Fail "$Label missing: $Path" }
}

function Require-Text($Path, $Pattern, $Label) {
  $full = Join-Path $Root $Path
  if (!(Test-Path -LiteralPath $full -PathType Leaf)) {
    Fail "$Label missing source: $Path"
    return
  }
  $content = Get-Content -Raw -LiteralPath $full
  if ($content -match $Pattern) { Pass $Label } else { Fail "$Label not found in $Path" }
}

Write-Host "Project DANILO repository verification"
Write-Host "Root: $Root"

Require-File "danilo.sh" "installer entrypoint"
Require-Dir "lib" "installer modules"
Require-Dir "models" "custom GGUF model folder"
Require-Dir "docs" "documentation folder"
Require-Dir "scripts" "verification scripts folder"

if (Test-Path -LiteralPath (Join-Path $Root "templates\frontend")) {
  Fail "templates/frontend must be removed; lib/frontend.sh is the only frontend source"
} else {
  Pass "no duplicate templates/frontend source"
}

@(
  "common.sh", "logging.sh", "cleanup.sh", "preflight.sh", "docker.sh", "network.sh",
  "wifi.sh", "database.sh", "backend.sh", "frontend.sh", "ai.sh", "services.sh",
  "sync.sh", "verify.sh"
) | ForEach-Object { Require-File "lib\$_" "module $_" }

@(
  "README.md", "docs\INSTALL.md", "docs\TROUBLESHOOTING.md",
  "docs\CUSTOM_MODEL.md", "docs\RELEASE_CHECKLIST.md", "docs\VERIFY.md"
) | ForEach-Object { Require-File $_ "documentation $_" }

Require-Text "danilo.sh" "--clean-install" "clean install mode"
Require-Text "danilo.sh" "--update" "update mode"
Require-Text "danilo.sh" "--verify" "verify mode"
Require-Text "danilo.sh" "--uninstall" "uninstall mode"
Require-Text "lib\cleanup.sh" "rollback_install" "rollback support"
Require-Text "lib\logging.sh" "sanitize_text" "secret redaction helper"
Require-Text "lib\backend.sh" "hash_password" "password hashing"
Require-Text "lib\backend.sh" "require_role" "role enforcement"
Require-Text "lib\backend.sh" "ensure_teacher_course" "teacher class isolation"
Require-Text "lib\backend.sh" "ensure_student_enrolled" "student data isolation"
Require-Text "lib\backend.sh" "materials/generate" "teacher upload lesson generation endpoint"
Require-Text "lib\backend.sh" "teacher/insights" "student analytics endpoint"
Require-Text "lib\backend.sh" "MATERIAL_EXTENSIONS = \{`".pdf`", `".ppt`", `".pptx`", `".docx`", `".txt`"\}" "document upload formats"
Require-Text "lib\frontend.sh" "Writing generated DANILO frontend" "generated frontend source of truth"
Require-Text "lib\frontend.sh" "apiUpload" "frontend upload client"
Require-Text "lib\frontend.sh" "build_frontend_static" "frontend static build function"
Require-Text "lib\frontend.sh" "npm --prefix" "frontend npm install/build commands"
Require-Text "lib\frontend.sh" "base: `"/`"" "Vite base path is absolute root"
Require-Text "lib\frontend.sh" "frontend/dist/assets" "frontend dist assets validation"
Require-Text "lib\frontend.sh" "Frontend index.html does not reference a built JavaScript bundle" "frontend built JS reference validation"
Require-Text "lib\frontend.sh" "Frontend index.html does not reference a built CSS bundle" "frontend built CSS reference validation"
Require-Text "lib\frontend.sh" "danilo-frontend-build=" "frontend build marker generation"
Require-Text "lib\frontend.sh" "ErrorBoundary" "frontend runtime error boundary"
Require-Text "lib\frontend.sh" "console.info\(\""\[DANILO\] frontend mount starting" "frontend mount debug logging"
Require-Text "lib\frontend.sh" 'apiRequest\("/auth/login"' "frontend login uses normalized API route"
Require-Text "lib\frontend.sh" "fetch\(request, \{ cache: `"no-store`" \}\)" "service worker fetches fresh app shell"
Require-Text "lib\frontend.sh" "DANILO is offline" "service worker offline fallback UI"
Require-Text "lib\frontend.sh" "Generate Lesson From Material" "teacher upload UI"
Require-Text "lib\ai.sh" "danilo-custom" "custom GGUF model registration"
Require-Text "lib\ai.sh" "qwen2.5:1.5b-instruct-q4_K_M" "default Ollama fallback model"
Require-Text "lib\verify.sh" "Admin login endpoint works" "admin login verification"
Require-Text "lib\verify.sh" "\[PASS\]" "explicit PASS verification output"
Require-Text "lib\verify.sh" "\[FAIL\]" "explicit FAIL verification output"
Require-Text "lib\verify.sh" "Backend API reachable" "backend curl verification"
Require-Text "lib\verify.sh" "Frontend reachable" "frontend curl verification"
Require-Text "lib\verify.sh" "Frontend static bundle reachable" "frontend static bundle curl verification"
Require-Text "lib\verify.sh" "Frontend dist index.html exists" "frontend dist index verification"
Require-Text "lib\verify.sh" "Frontend dist assets are present" "frontend dist assets verification"
Require-Text "lib\verify.sh" "Frontend dist JavaScript bundle exists" "frontend dist JS verification"
Require-Text "lib\verify.sh" "Frontend dist build marker exists" "frontend build marker verification"
Require-Text "lib\verify.sh" "Gateway is serving latest frontend build" "gateway latest build verification"
Require-Text "lib\verify.sh" "HTTP 200" "frontend HTTP status verification"
Require-Text "lib\verify.sh" "Ollama API reachable" "Ollama API verification"
Require-Text "lib\verify.sh" "Active AI model is loaded" "active AI model verification"
Require-Text "lib\verify.sh" "resolves locally" "danilo.local resolution verification"
Require-Text "lib\services.sh" "healthcheck" "container healthchecks"
Require-Text "lib\services.sh" "root  /opt/danilo/app/frontend/dist" "nginx serves mounted frontend dist"
Require-Text "lib\services.sh" "try_files .* /index.html" "SPA route fallback"
Require-Text "lib\services.sh" "./frontend/dist:/opt/danilo/app/frontend/dist:ro" "gateway mounts frontend dist"
Require-Text "lib\services.sh" "find /opt/danilo/app/frontend/dist/assets -type f -name '\*\.js'" "gateway healthcheck verifies JS bundle"
Require-Text "lib\services.sh" "find /opt/danilo/app/frontend/dist/assets -type f -name '\*\.css'" "gateway healthcheck verifies CSS bundle"
Require-Text "lib\services.sh" "danilo-build.txt" "gateway healthcheck verifies build marker"

if (Get-ChildItem -LiteralPath (Join-Path $Root "models") -Filter "*.gguf" -File -ErrorAction SilentlyContinue | Select-Object -First 1) {
  Pass "custom GGUF model present"
} else {
  Pass "no custom GGUF present; installer will use default Ollama model"
}

if ($failed) {
  Write-Host "Project DANILO repository verification failed." -ForegroundColor Red
  exit 1
}

Write-Host "Project DANILO repository verification passed." -ForegroundColor Green
