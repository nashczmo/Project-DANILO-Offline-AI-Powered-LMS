# Project DANILO installer module: frontend.sh

write_frontend_files() {
  mkdir -p "${APP_ROOT}/frontend/src/components" "${APP_ROOT}/frontend/public/icons" "${APP_ROOT}/frontend/public/fonts"

  note "Writing generated DANILO frontend"

  # package.json
  cat > "${APP_ROOT}/frontend/package.json" <<'EOF'
{
  "name": "project-danilo-frontend",
  "version": "4.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4173"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.1"
  }
}
EOF

  cat > "${APP_ROOT}/frontend/vite.config.js" <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
EOF

  cat > "${APP_ROOT}/frontend/postcss.config.js" <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

  cat > "${APP_ROOT}/frontend/tailwind.config.js" <<'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        warm: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
        },
        success: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl:   "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        "sm":   "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md":   "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "lg":   "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        "xl":   "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        "inner-soft": "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
        "ring": "0 0 0 3px rgb(99 102 241 / 0.15)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out both",
        "slide-up":   "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-left": "slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in":   "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float":      "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideLeft: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
      }
    },
  },
  plugins: [],
};
EOF

  cat > "${APP_ROOT}/frontend/index.html" <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#f8fafc" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="description" content="Project DANILO — offline Learning Management System for DepEd schools." />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>DANILO Learning Management System</title>
  </head>
  <body class="bg-slate-50 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

  cat > "${APP_ROOT}/frontend/public/manifest.webmanifest" <<'EOF'
{
  "name": "Project DANILO LMS",
  "short_name": "DANILO",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#f8fafc",
  "background_color": "#f8fafc",
  "description": "Offline Learning Management System for DepEd schools",
  "icons": [
    { "src": "/icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
}
EOF

  cat > "${APP_ROOT}/frontend/public/sw.js" <<'EOF'
const CACHE_NAME = "danilo-static-v4";
const STATIC_FILES = ["/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];
const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DANILO Offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
      main { max-width: 28rem; padding: 1.5rem; text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
      p { color: #64748b; line-height: 1.6; margin: 0; }
    </style>
  </head>
  <body><main><h1>DANILO is offline</h1><p>The local portal could not be reached. Refresh after the gateway is back online.</p></main></body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=UTF-8" } })
      )
    );
    return;
  }
  if (url.origin === self.location.origin && ["/icons/", "/assets/"].some((p) => url.pathname.startsWith(p))) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
EOF

  cat > "${APP_ROOT}/frontend/public/icons/icon-192.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="42" fill="#4f46e5"/>
  <rect x="16" y="16" width="160" height="160" rx="34" fill="#6366f1"/>
  <path d="M60 130V62h36c24 0 38 13 38 32s-14 36-38 36H80v20H60zm20-34h16c14 0 22-7 22-18s-8-16-22-16H80v34z" fill="#ffffff" opacity="0.95"/>
  <circle cx="138" cy="56" r="14" fill="#fbbf24"/>
</svg>
EOF

  cat > "${APP_ROOT}/frontend/public/icons/icon-512.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#4f46e5"/>
  <rect x="40" y="40" width="432" height="432" rx="84" fill="#6366f1"/>
  <path d="M152 350V162h96c64 0 102 36 102 90s-38 98-102 98h-42v52H152zm54-100h42c38 0 60-18 60-48s-22-46-60-46h-42v94z" fill="#ffffff" opacity="0.95"/>
  <circle cx="372" cy="148" r="38" fill="#fbbf24"/>
</svg>
EOF

  # Uses rsms/inter CDN only at BUILD TIME; the .woff2 files are then served locally
  local FONT_DIR="${APP_ROOT}/frontend/public/fonts"
  local INTER_BASE="https://rsms.me/inter/font-files"
  local INTER_FILES="Inter-Regular.woff2 Inter-Medium.woff2 Inter-SemiBold.woff2 Inter-Bold.woff2 Inter-ExtraBold.woff2"
  for f in $INTER_FILES; do
    if [ ! -f "${FONT_DIR}/${f}" ]; then
      curl -fsSL -o "${FONT_DIR}/${f}" "${INTER_BASE}/${f}" 2>/dev/null || true
    fi
  done

  cat > "${APP_ROOT}/frontend/src/main.jsx" <<'EOF'
import React, { Component } from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[DANILO] app render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-danger-200 bg-white p-8 shadow-lg text-center">
            <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">DANILO encountered an error. Please refresh or run installer verification.</p>
            <button className="mt-5 dn-btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

console.info("[DANILO] frontend mount starting");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.info("[DANILO] service worker registered"))
      .catch((error) => console.error("[DANILO] service worker registration failed", error));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
EOF

  cat > "${APP_ROOT}/frontend/src/index.css" <<'EOF'
@font-face { font-family: "Inter"; font-style: normal; font-weight: 400; font-display: swap; src: url("/fonts/Inter-Regular.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 500; font-display: swap; src: url("/fonts/Inter-Medium.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 600; font-display: swap; src: url("/fonts/Inter-SemiBold.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 700; font-display: swap; src: url("/fonts/Inter-Bold.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 800; font-display: swap; src: url("/fonts/Inter-ExtraBold.woff2") format("woff2"); }

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ========================================================================
   DANILO HORIZON DESIGN SYSTEM v4
   Clean, warm, educational — built for Philippine DepEd schools
   ======================================================================== */

:root {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  --sidebar-w: 260px;
  --header-h: 56px;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100dvh;
  background: #f8fafc;
}

#root { min-height: 100dvh; }

input, select, textarea { font-family: inherit; }

::selection { background: #6366f1; color: #fff; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

/* ========================================================================
   COMPONENT CLASSES
   ======================================================================== */

@layer components {

  /* ---- Cards ---- */
  .dn-card {
    @apply bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm;
    transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
  }
  .dn-card-hover:hover {
    @apply shadow-lg border-slate-300/80;
    transform: translateY(-2px);
  }
  .dn-card-interactive {
    @apply dn-card cursor-pointer;
  }
  .dn-card-interactive:hover {
    @apply shadow-lg border-primary-200;
    transform: translateY(-2px);
  }

  /* ---- Typography ---- */
  .dn-title {
    @apply text-xl font-semibold text-slate-900 tracking-tight;
  }
  .dn-subtitle {
    @apply text-sm text-slate-500;
  }
  .dn-overline {
    @apply text-[11px] font-semibold uppercase tracking-wider text-slate-400;
  }

  /* ---- Inputs ---- */
  .dn-input {
    @apply w-full bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none rounded-lg;
    border: 1px solid #e2e8f0;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .dn-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .dn-input::placeholder {
    @apply text-slate-400;
  }
  .dn-input:disabled {
    @apply bg-slate-50 text-slate-400 cursor-not-allowed;
  }

  /* ---- Buttons ---- */
  .dn-btn {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg;
    transition: all 0.15s ease;
    cursor: pointer;
    user-select: none;
  }
  .dn-btn:disabled {
    @apply opacity-40 cursor-not-allowed;
  }
  .dn-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .dn-btn-primary {
    @apply dn-btn bg-primary-600 text-white shadow-sm shadow-primary-600/20;
  }
  .dn-btn-primary:hover:not(:disabled) {
    @apply bg-primary-700 shadow-md shadow-primary-600/30;
  }
  .dn-btn-secondary {
    @apply dn-btn bg-white text-slate-700 border border-slate-200 shadow-sm;
  }
  .dn-btn-secondary:hover:not(:disabled) {
    @apply bg-slate-50 border-slate-300 shadow-md;
  }
  .dn-btn-accent {
    @apply dn-btn bg-accent-600 text-white shadow-sm shadow-accent-600/20;
  }
  .dn-btn-accent:hover:not(:disabled) {
    @apply bg-accent-700 shadow-md shadow-accent-600/30;
  }
  .dn-btn-warm {
    @apply dn-btn bg-warm-500 text-white shadow-sm shadow-warm-500/20;
  }
  .dn-btn-warm:hover:not(:disabled) {
    @apply bg-warm-600 shadow-md shadow-warm-500/30;
  }
  .dn-btn-danger {
    @apply dn-btn bg-danger-500 text-white shadow-sm shadow-danger-500/20;
  }
  .dn-btn-danger:hover:not(:disabled) {
    @apply bg-danger-600 shadow-md shadow-danger-500/30;
  }
  .dn-btn-ghost {
    @apply dn-btn bg-transparent text-slate-600;
  }
  .dn-btn-ghost:hover:not(:disabled) {
    @apply bg-slate-100 text-slate-900;
  }

  /* ---- Badges ---- */
  .dn-badge {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold;
  }

  /* ---- Status dot ---- */
  .dn-status-dot {
    @apply inline-block w-2 h-2 rounded-full bg-success-500 flex-shrink-0;
  }
  .dn-status-dot-pulse {
    animation: pulseDot 2s ease-in-out infinite;
  }
}

/* ========================================================================
   LAYOUT HELPERS
   ======================================================================== */

.dn-page-enter {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.pb-safe-nav {
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}

.pb-safe-chat {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ========================================================================
   MOBILE RESPONSIVE TABLE
   ======================================================================== */

@media (max-width: 639px) {
  table[role="table"] thead,
  .data-table thead {
    position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0);
  }
  table[role="table"] tr,
  .data-table tr {
    display: block; margin: 0 0 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; overflow: hidden;
  }
  table[role="table"] td,
  .data-table td {
    display: block; border-bottom: 1px solid #f1f5f9; padding: 10px 14px;
  }
  table[role="table"] td:first-child,
  .data-table td:first-child { font-weight: 600; color: #1e293b; }
  table[role="table"] td:last-child,
  .data-table td:last-child { border-bottom: 0; }
}

/* ========================================================================
   REDUCED MOTION
   ======================================================================== */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ========================================================================
   FOCUS VISIBLE
   ======================================================================== */

:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ========================================================================
   TOUCH ERGONOMICS
   ======================================================================== */

button, .dn-btn, .dn-input, select, input, textarea {
  touch-action: manipulation;
}

button, .dn-btn {
  min-height: 44px;
}

img { content-visibility: auto; }
EOF

  cat > "${APP_ROOT}/frontend/src/api.js" <<'EOF'
const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || "/api").replace(/\/$/, "");

function buildHeaders(token, extras = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extras
  };
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = normalizedPath.startsWith("/api/")
    ? normalizedPath
    : `${API_BASE}${normalizedPath}`;
  let response;
  try {
    console.debug("[DANILO] API request", method, endpoint);
    response = await fetch(endpoint, {
      method,
      headers: buildHeaders(token),
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    console.error("[DANILO] API network error", endpoint, error);
    throw error;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || "Request failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    console.error("[DANILO] API error response", endpoint, response.status, payload);
    throw error;
  }

  console.debug("[DANILO] API response", method, endpoint, response.status);
  return payload;
}

export async function apiUpload(path, { token, formData } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = normalizedPath.startsWith("/api/")
    ? normalizedPath
    : `${API_BASE}${normalizedPath}`;
  let response;
  try {
    console.debug("[DANILO] API upload", endpoint);
    response = await fetch(endpoint, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
  } catch (error) {
    console.error("[DANILO] API upload network error", endpoint, error);
    throw error;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || "Upload failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    console.error("[DANILO] API upload error response", endpoint, response.status, payload);
    throw error;
  }

  console.debug("[DANILO] API upload response", endpoint, response.status);
  return payload;
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/InstallBanner.jsx" <<'EOF'
export default function InstallBanner({ promptEvent, onInstall, onDismiss }) {
  if (!promptEvent) return null;
  return (
    <div className="dn-card p-4 mb-5 animate-slide-down border-primary-200 bg-primary-50/50" role="banner">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Install DANILO</p>
            <p className="text-xs text-slate-500 truncate">Add to your home screen for quick offline access</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onDismiss} className="dn-btn-ghost text-xs py-1.5 min-h-[36px]">Later</button>
          <button onClick={onInstall} className="dn-btn-primary text-xs py-1.5 min-h-[36px]">Install</button>
        </div>
      </div>
    </div>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/LoginView.jsx" <<'EOF'
export default function LoginView({ form, onChange, onSubmit, loading, error }) {
  return (
    <div className="min-h-screen flex bg-slate-50" role="main">
      {/* Left Panel - Credentials Portal (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-8 sm:p-12 relative z-10 bg-white shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] border-r border-slate-100">
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">DANILO</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Localized &middot; Offline</p>
        </div>

        <div className="my-auto w-full max-w-[380px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your learning portal</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" aria-label="Login form">
            <div>
              <input
                id="login-username" name="username" value={form.username} onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-center font-medium" 
                placeholder="Username"
                autoComplete="username" autoCapitalize="none" aria-required="true"
              />
            </div>
            <div>
              <input
                id="login-password" type="password" name="password" value={form.password} onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-center font-medium" 
                placeholder="Password"
                autoComplete="current-password" aria-required="true"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 animate-scale-in text-center" role="alert">
                <p className="text-sm font-medium text-danger-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-2xl bg-primary-600 text-white font-semibold py-3.5 text-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-white animate-spin" />
                  Authenticating...
                </span>
              ) : "Sign In"}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">System Roles</p>
          <div className="flex items-center justify-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide">Admin</span>
            <span className="px-3 py-1 rounded-full bg-warm-50 border border-warm-200 text-warm-700 text-xs font-semibold tracking-wide">Faculty</span>
            <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold tracking-wide">Learner</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding Anchor (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden items-center justify-center bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-100 via-slate-50 to-white opacity-80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiLz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white border border-primary-100 shadow-xl shadow-primary-500/10 flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm mb-4">
            DANILO
          </h1>
          <p className="text-xl font-medium text-slate-500 tracking-wide">
            Localized. Offline. Empowered.
          </p>
        </div>
      </div>
    </div>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/StreamView.jsx" <<'EOF'
const TYPE_CONFIG = {
  announcement: { bg: "bg-primary-50",  text: "text-primary-600",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  assignment:   { bg: "bg-warm-50",     text: "text-warm-700",     icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" },
  reminder:     { bg: "bg-accent-50",   text: "text-accent-700",   icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
};

function PostCard({ item }) {
  const cfg = TYPE_CONFIG[item.postType] || { bg: "bg-slate-50", text: "text-slate-500", icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" };
  const publishedAt = item.createdAt ? new Date(item.createdAt) : null;
  const publishedLabel = publishedAt && !Number.isNaN(publishedAt.getTime())
    ? publishedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <article className="dn-card dn-card-hover p-5 animate-slide-up" role="article">
      <div className="flex gap-3.5">
        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <svg className={`w-4.5 h-4.5 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`dn-badge ${cfg.bg} ${cfg.text}`}>{item.postType}</span>
            <span className="text-xs text-slate-400">{item.courseCode}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{item.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{item.body}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-slate-400">
            <span className="font-medium text-slate-600">{item.authorName}</span>
            <span>&middot;</span>
            <span>{item.courseTitle}</span>
            {publishedLabel && (
              <>
                <span>&middot;</span>
                <time dateTime={item.createdAt}>{publishedLabel}</time>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StreamView({ items }) {
  return (
    <section className="dn-page-enter" aria-label="Activity Stream">
      <div className="mb-5">
        <h2 className="dn-title">Stream</h2>
        <p className="dn-subtitle mt-0.5">Announcements, assignments, and reminders from your faculty.</p>
      </div>
      {!items || items.length === 0 ? (
        <Empty title="No posts yet" body="Faculty announcements will appear here." icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>} />
      ) : (
        <div className="space-y-3">{items.map((item) => <PostCard key={item.id} item={item} />)}</div>
      )}
    </section>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/ContentView.jsx" <<'EOF'
const SUBJECT_COLORS = {
  English:     { bg: "bg-primary-50",  text: "text-primary-600",  bar: "bg-primary-500" },
  Mathematics: { bg: "bg-warm-50",     text: "text-warm-700",     bar: "bg-warm-500" },
  Science:     { bg: "bg-accent-50",   text: "text-accent-700",   bar: "bg-accent-500" },
  Filipino:    { bg: "bg-purple-50",   text: "text-purple-600",   bar: "bg-purple-500" },
};

function getColor(subject) {
  return SUBJECT_COLORS[subject] || { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-400" };
}

function LessonCard({ item }) {
  const c = getColor(item.subject);
  return (
    <article className="dn-card dn-card-hover overflow-hidden group">
      <div className={`h-1 ${c.bar}`} />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={`dn-badge ${c.bg} ${c.text}`}>{item.subject}</span>
          <span className="dn-badge bg-slate-100 text-slate-600">{item.quarter} &middot; W{item.week}</span>
          <span className="text-[11px] text-slate-400 font-mono">{item.melcCode}</span>
        </div>
        <p className="dn-overline mb-0.5">{item.folderName}</p>
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">{item.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
        {item.essentialQuestion && (
          <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 mb-3 border border-slate-100">
            <p className="dn-overline mb-0.5">Essential Question</p>
            <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{item.essentialQuestion}&rdquo;</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">{item.courseCode}</span> &middot; {item.gradeLevel}
          </div>
          <a href={item.pdfUrl} target="_blank" rel="noreferrer"
            className="dn-btn-primary text-xs py-1.5 px-3 min-h-[32px]"
            aria-label={`Open PDF for ${item.title}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Open PDF
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ContentView({ items, search, onSearchChange, quarter, onQuarterChange, subject, onSubjectChange, workflow }) {
  const subjects = [...new Set(items.map((i) => i.subject))];
  const hasFilters = Boolean(search.trim() || quarter || subject);

  return (
    <section className="dn-page-enter" aria-label="Lesson Library">
      <div className="mb-5">
        <h2 className="dn-title">Lessons</h2>
        <p className="dn-subtitle mt-0.5">MELC-aligned modules for offline classroom delivery.</p>
      </div>

      <div className="dn-card p-4 mb-5" role="search">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={onSearchChange} placeholder="Search lessons..." className="dn-input pl-10" aria-label="Search lessons" />
          </div>
          <select value={quarter} onChange={onQuarterChange} className="dn-input" aria-label="Filter by quarter">
            <option value="">All Quarters</option>
            <option value="Q1">Quarter 1</option><option value="Q2">Quarter 2</option><option value="Q3">Quarter 3</option><option value="Q4">Quarter 4</option>
          </select>
          <select value={subject} onChange={onSubjectChange} className="dn-input" aria-label="Filter by subject">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty title="No modules found" body={search ? "Try adjusting your search filters." : "Your faculty has not uploaded any modules yet."} icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{items.map((item) => <LessonCard key={item.id} item={item} />)}</div>
      )}
    </section>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/GradesView.jsx" <<'EOF'
function gradeStyle(score) {
  if (score >= 90) return { bg: "bg-success-50", text: "text-success-700", bar: "bg-success-500", ring: "ring-success-200" };
  if (score >= 75) return { bg: "bg-primary-50",  text: "text-primary-700", bar: "bg-primary-500", ring: "ring-primary-200" };
  if (score >= 60) return { bg: "bg-warm-50",     text: "text-warm-700",    bar: "bg-warm-500",    ring: "ring-warm-200" };
  return                   { bg: "bg-danger-50",   text: "text-danger-700",  bar: "bg-danger-500",  ring: "ring-danger-200" };
}

export default function GradesView({ grades }) {
  return (
    <section className="dn-page-enter" aria-label="My Grades">
      <div className="mb-5">
        <h2 className="dn-title">Grades</h2>
        <p className="dn-subtitle mt-0.5">Performance summary per subject and quarter.</p>
      </div>
      {!grades || grades.length === 0 ? (
        <Empty title="No grades available" body="Grades will appear after faculty record scores." icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>} />
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => {
            const gs = gradeStyle(grade.finalGrade);
            return (
              <article key={`${grade.courseId}-${grade.quarter}`} className="dn-card overflow-hidden animate-slide-up">
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="min-w-0">
                      <p className="dn-overline text-warm-600">{grade.subject}</p>
                      <h3 className="text-base font-semibold text-slate-900 tracking-tight mt-1">{grade.courseTitle}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{grade.courseCode} &middot; Quarter {grade.quarter}</p>
                      {grade.teacher && <p className="text-xs text-slate-400 mt-0.5">Faculty: {grade.teacher}</p>}
                    </div>
                    <div className={`rounded-xl ${gs.bg} ring-1 ${gs.ring} px-5 py-3 text-center flex-shrink-0`}>
                      <p className={`text-[10px] font-bold ${gs.text} uppercase tracking-widest`}>Final Grade</p>
                      <p className={`text-3xl font-extrabold ${gs.text} tracking-tight`}>{grade.finalGrade}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${gs.bar} transition-all duration-700`} style={{ width: `${Math.min(100, grade.finalGrade)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                      <span>0</span>
                      <span>75 passing</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-sm" role="table">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-2 text-left dn-overline">Component</th>
                          <th className="px-4 py-2 text-left dn-overline">Score</th>
                          <th className="px-4 py-2 text-left dn-overline">Weight</th>
                          <th className="px-4 py-2 text-left dn-overline hidden sm:table-cell">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grade.components.map((c) => (
                          <tr key={`${grade.courseId}-${grade.quarter}-${c.component}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-700">{c.component}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{c.score}/{c.maxScore} <span className="text-slate-400">({c.percentage}%)</span></td>
                            <td className="px-4 py-2.5 text-slate-500">{Math.round(c.weight * 100)}%</td>
                            <td className="px-4 py-2.5 text-slate-400 italic text-xs hidden sm:table-cell">{c.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/TutorView.jsx" <<'EOF'
import { useEffect, useRef } from "react";

function ChatBubbleUser({ content }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-primary-600 text-white px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function ChatBubbleAI({ content, context }) {
  return (
    <div className="flex justify-start gap-2.5 animate-slide-up">
      <div className="w-7 h-7 rounded-full bg-warm-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
      </div>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="dn-card px-4 py-3">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {context?.gradeSignals?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
            {context.gradeSignals.map((s) => (
              <span key={s} className="dn-badge bg-warm-50 text-warm-700 border border-warm-200">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-warm-500 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
      </div>
      <div className="dn-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Thinking...</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TutorView({ token, modules, form, onChange, onSubmit, loading, messages }) {
  const hasModules = modules && modules.length > 0;
  const endRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionMessages, setSessionMessages] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sessionMessages, loading]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/ai/sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token, messages]);

  async function loadSession(id) {
    setActiveSessionId(id);
    setSidebarOpen(false);
    try {
      const data = await fetch(`/api/ai/sessions/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      setSessionMessages(data.messages || []);
    } catch (_) { setSessionMessages([]); }
  }

  async function newSession() {
    setActiveSessionId(null);
    setSessionMessages(null);
    setSidebarOpen(false);
  }

  async function deleteSession(id, e) {
    e.stopPropagation();
    await fetch(`/api/ai/sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) { setActiveSessionId(null); setSessionMessages(null); }
  }

  function fmtTime(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (_) { return ""; }
  }

  const displayMessages = sessionMessages !== null ? sessionMessages : (messages || []);

  return (
    <section className="flex h-[calc(100dvh-150px)] sm:h-[calc(100dvh-170px)] lg:h-[calc(100dvh-140px)] min-h-[480px] gap-3 dn-page-enter" aria-label="AI Tutor">

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Chat History</span>
          <button onClick={newSession} className="text-xs dn-btn-primary px-2.5 py-1 min-h-[28px]">+ New</button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">No previous sessions</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors group ${activeSessionId === s.id ? "bg-primary-50" : ""}`}
            >
              <p className={`text-xs font-medium truncate ${activeSessionId === s.id ? "text-primary-700" : "text-slate-700"}`}>{s.title}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-slate-400">{s.messageCount} msg</span>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-danger-500 hover:text-danger-700 px-1 transition-opacity"
                  title="Delete session"
                >✕</button>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <div className="w-8 h-8 rounded-lg bg-warm-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">DANILO AI Tutor</h2>
              <p className="text-[10px] text-slate-400">Offline · Local Ollama</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <button onClick={newSession} className="text-xs dn-btn-secondary px-2.5 py-1 min-h-[28px]">New Chat</button>
            )}
            <div className="hidden sm:flex items-center gap-1 bg-warm-50 border border-warm-200 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-warm-500 dn-status-dot-pulse" />
              <span className="text-[10px] font-medium text-warm-700">Offline AI</span>
            </div>
          </div>
        </div>

        {sessionMessages === null && (
          <div className="flex-shrink-0 mb-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select name="moduleId" value={form.moduleId} onChange={onChange} className="dn-input text-sm" aria-label="Select lesson context">
                <option value="">{hasModules ? "Select lesson context (optional)" : "No modules available"}</option>
                {(modules || []).map((m) => <option key={m.id} value={m.id}>{m.subject} · {m.title}</option>)}
              </select>
              <select name="responseMode" value={form.responseMode} onChange={onChange} className="dn-input sm:w-28 text-sm" aria-label="Response mode">
                <option value="short">Short</option>
                <option value="normal">Normal</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3 min-h-0 overscroll-contain" role="log" aria-live="polite">
          {displayMessages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-warm-50 border border-warm-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Ready to help</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {activeSessionId ? "This session is empty." : hasModules ? "Select a lesson and ask a question." : "Ask anything — the AI runs entirely offline."}
              </p>
            </div>
          )}
          {displayMessages.map((msg, idx) => {
            const key = msg.id || idx;
            const ts = msg.createdAt ? fmtTime(msg.createdAt) : "";
            return msg.role === "user"
              ? <div key={key}><ChatBubbleUser content={msg.content} />{ts && <p className="text-right text-[10px] text-slate-300 mt-0.5 pr-1">{ts}</p>}</div>
              : <div key={key}><ChatBubbleAI content={msg.content} context={msg.context} />{ts && <p className="text-[10px] text-slate-300 mt-0.5 pl-10">{ts}</p>}</div>;
          })}
          {loading && <TypingIndicator />}
          <div ref={endRef} />
        </div>

        {sessionMessages === null && (
          <form onSubmit={onSubmit} className="flex-shrink-0 mt-3 pb-safe-chat">
            <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
              <input
                name="question" value={form.question} onChange={onChange}
                placeholder="Ask a question..."
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                aria-label="Type your question" disabled={loading}
              />
              <button type="submit" disabled={loading || !form.question.trim()} className="dn-btn-warm min-w-[44px] flex-shrink-0 px-3 rounded-lg" aria-label="Send message">
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/shared.jsx" <<'EOF'
import { useState } from "react";

export const GRADES = {
  Kinder: ["Kinder"],
  Elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};
export const STRANDS = ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Arts and Design", "Sports"];
export const DEPED_SUBJECTS = [
  "Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "MAPEH", "TLE", "ESP",
  "Mother Tongue", "Oral Communication", "Reading and Writing", "General Mathematics",
  "Statistics and Probability", "Earth and Life Science", "Physical Science", "Biology",
  "Chemistry", "Physics", "Practical Research", "Media and Information Literacy",
  "Empowerment Technologies", "Personal Development", "Contemporary Arts",
  "Understanding Culture, Society, and Politics", "Philosophy",
];
export const ASSESSMENT_TYPES = ["Written Work", "Performance Task", "Quarterly Assessment", "Quiz", "Assignment", "Project", "Recitation", "Portfolio"];


export function Field({ label, children, className = "" }) {
  return (
    <label className={`grid gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Stat({ label, value, accent }) {
  const displayValue = value === undefined || value === null ? "-" : value;
  return (
    <div className="dn-card p-4 text-center">
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-primary-600" : "text-slate-900"}`}>
        {displayValue}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

export function Empty({ icon, title, body }) {
  return (
    <div className="dn-card p-10 text-center animate-slide-up">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-slate-200/50 animate-float">
        {icon || <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
      </div>
      <p className="font-semibold text-slate-800 tracking-tight">{title}</p>
      {body && <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">{body}</p>}
    </div>
  );
}

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-600",
    blue:    "bg-primary-50 text-primary-700",
    green:   "bg-success-50 text-success-700",
    gold:    "bg-warm-50 text-warm-700",
    red:     "bg-danger-50 text-danger-700",
    purple:  "bg-purple-50 text-purple-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="dn-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}


export function GradeCascade({ value, onChange }) {
  const edu = value.educationLevel || "Junior High School";
  const gs = GRADES[edu];

  function patch(next) {
    const e = next.educationLevel || edu;
    const gl = GRADES[e].includes(next.gradeLevel || value.gradeLevel)
      ? (next.gradeLevel || value.gradeLevel)
      : GRADES[e][0];
    onChange({
      ...value,
      ...next,
      educationLevel: e,
      gradeLevel: gl,
      strand: e === "Senior High School" ? (next.strand || value.strand || STRANDS[0]) : "",
    });
  }

  return (
    <>
      <Field label="Education Level">
        <select className="dn-input" value={edu} onChange={(e) => patch({ educationLevel: e.target.value })}>
          {Object.keys(GRADES).map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="Grade Level">
        <select className="dn-input" value={value.gradeLevel || gs[0]} onChange={(e) => patch({ gradeLevel: e.target.value })}>
          {gs.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      {edu === "Senior High School" && (
        <Field label="Strand">
          <select className="dn-input" value={value.strand || STRANDS[0]} onChange={(e) => patch({ strand: e.target.value })}>
            {STRANDS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
      )}
    </>
  );
}

export async function downloadReport(path, filename, token) {
  const response = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Report export failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
EOF

  cat > "${APP_ROOT}/frontend/src/components/AdminPages.jsx" <<'EOF'
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { ASSESSMENT_TYPES, DEPED_SUBJECTS, Badge, Empty, Field, GradeCascade, SectionHeader, Stat, downloadReport } from "./shared";

/* ========================================================================
   ADMIN: USER MANAGEMENT
   ======================================================================== */

const defaultUserForm = {
  role: "student", fullName: "", username: "", password: "danilo123",
  educationLevel: "Junior High School", gradeLevel: "Grade 7", strand: "", sectionName: "",
};

const ROLE_DISPLAY = { student: "Learner", teacher: "Faculty", admin: "Admin" };
const ROLE_BADGE_TONE = { admin: "blue", teacher: "gold", student: "green" };

function makeUsername(fullName, role, sectionName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";
  const initials = parts.map((p) => p[0].toUpperCase()).join("");
  if (role === "teacher") return `FAC-${initials}`;
  if (role === "admin") return `ADM-${initials}`;
  const sec = String(sectionName || "LRN").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${sec}-${initials}`;
}

export function AdminUsersView({ token, users, reload }) {
  const [form, setForm] = useState(defaultUserForm);
  const [edit, setEdit] = useState(null);
  const [filter, setFilter] = useState("");
  const [sections, setSections] = useState([]);
  const visible = users.filter((u) => !filter || u.role === filter);

  useEffect(() => {
    apiRequest("/admin/sections", { token }).then((d) => setSections(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const username = (form.username || makeUsername(form.fullName, form.role)).trim();
    if (!form.fullName.trim() || !username) return;
    const payload = { ...form, username };
    if (edit) {
      await apiRequest(`/admin/users/${edit.id}`, { method: "PUT", token, body: payload });
      setEdit(null);
    } else {
      await apiRequest("/admin/users", { method: "POST", token, body: payload });
    }
    setForm(defaultUserForm);
    reload();
  }

  function startEdit(u) {
    setEdit(u);
    setForm({
      role: u.role, fullName: u.fullName, username: u.username, password: "",
      educationLevel: u.educationLevel || "Junior High School",
      gradeLevel: u.gradeLevel || "Grade 7", strand: u.strand || "", sectionName: u.sectionName || "",
    });
  }

  return (
    <section className="space-y-5 dn-page-enter" aria-label="User Management">
      <div className="dn-card p-5">
        <SectionHeader
          title={edit ? "Edit User" : "New User"}
          subtitle={edit ? `Editing ${edit.fullName}` : "Add Faculty, Learners, or Admin accounts"}
        />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Role">
            <select className="dn-input" value={form.role} onChange={(e) => {
              const role = e.target.value;
              setForm((prev) => ({ ...prev, role, username: edit || prev.username ? prev.username : makeUsername(prev.fullName, role, prev.sectionName) }));
            }}>
              <option value="student">Learner</option><option value="teacher">Faculty</option><option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Full Name">
            <input className="dn-input" value={form.fullName} onChange={(e) => {
              const fullName = e.target.value;
              setForm((prev) => ({ ...prev, fullName, username: edit || prev.username ? prev.username : makeUsername(fullName, prev.role, prev.sectionName) }));
            }} required />
          </Field>
          <Field label="Username">
            <input
              className={`dn-input ${edit ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
              value={form.username}
              onChange={(e) => { if (!edit) setForm({ ...form, username: e.target.value }); }}
              readOnly={!!edit}
              placeholder="Auto-generated from name + section"
              autoCapitalize="none"
            />
          </Field>
          <GradeCascade value={form} onChange={setForm} />
          <Field label="Section">
            {sections.length > 0 ? (
              <select className="dn-input" value={form.sectionName} onChange={(e) => {
                const sectionName = e.target.value;
                setForm((prev) => ({ ...prev, sectionName, username: edit ? prev.username : makeUsername(prev.fullName, prev.role, sectionName) }));
              }}>
                <option value="">No section</option>
                {sections.map((s) => <option key={s.id} value={s.name}>{s.name} — {s.gradeLevel}</option>)}
              </select>
            ) : (
              <input className="dn-input bg-slate-50 text-slate-400" value="No sections yet — create sections first" readOnly />
            )}
          </Field>
          <div className="flex items-end gap-2">
            <button className="dn-btn-primary w-full">{edit ? "Save Changes" : "Create User"}</button>
            {edit && (
              <button type="button" className="dn-btn-secondary" onClick={() => { setEdit(null); setForm(defaultUserForm); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="User Accounts" subtitle={users.length ? `${users.length} total accounts` : "No users yet"}>
          <select className="dn-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Learners</option>
            <option value="teacher">Faculty</option>
            <option value="admin">Admins</option>
          </select>
        </SectionHeader>
        {visible.length ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm" role="table">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2.5 dn-overline">Name</th>
                  <th className="px-4 py-2.5 dn-overline">Role</th>
                  <th className="px-4 py-2.5 dn-overline">Username</th>
                  <th className="px-4 py-2.5 dn-overline hidden sm:table-cell">Level</th>
                  <th className="px-4 py-2.5 dn-overline">Status</th>
                  <th className="px-4 py-2.5 dn-overline">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{u.fullName}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={ROLE_BADGE_TONE[u.role] || "default"}>{u.displayRole || ROLE_DISPLAY[u.role] || u.role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">{u.username}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs hidden sm:table-cell">
                      {u.educationLevel || ""} {u.gradeLevel || ""} {u.strand || ""}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.isActive !== false ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(u)}>Edit</button>
                        <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]"
                          onClick={async () => { await apiRequest(`/admin/users/${u.id}`, { method: "DELETE", token }); reload(); }}>
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No accounts" body="Create Learner and Faculty accounts to begin enrollment." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   ADMIN: CLASS MANAGEMENT
   ======================================================================== */

const defaultCourseForm = {
  code: "", title: "", subject: "", educationLevel: "Junior High School",
  gradeLevel: "Grade 7", strand: "", quarter: "Q1", teacherId: "", description: "",
};

export function AdminClassesView({ token, users, courses, reload }) {
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const [form, setForm] = useState(defaultCourseForm);

  async function handleSubmit(e) {
    e.preventDefault();
    await apiRequest("/admin/courses", { method: "POST", token, body: form });
    setForm(defaultCourseForm);
    reload();
  }

  return (
    <section className="space-y-5 dn-page-enter" aria-label="Class Management">
      <div className="dn-card p-5">
        <SectionHeader title="Create Subject" subtitle="Set up a new subject and assign faculty" />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Code"><input className="dn-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
          <Field label="Title"><input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Subject">
            <select className="dn-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
              <option value="">Select subject...</option>
              {DEPED_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <GradeCascade value={form} onChange={setForm} />
          <Field label="Quarter">
            <select className="dn-input" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
              <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
            </select>
          </Field>
          <Field label="Faculty">
            <select className="dn-input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input className="dn-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <button className="dn-btn-primary w-full">Create Subject</button>
          </div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="All Subjects" subtitle={`${courses.length} subject${courses.length === 1 ? "" : "s"} configured`} />
        {courses.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="blue">{c.code}</Badge>
                  <Badge>{c.quarter}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 tracking-tight">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{c.subject}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {c.teacherName || "Unassigned"} &middot; {c.studentTotal ?? 0} learners &middot; {c.moduleTotal ?? 0} modules
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No subjects" body="Create a subject, assign faculty, then enroll learners." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   ADMIN: ENROLLMENT MANAGEMENT
   ======================================================================== */

export function AdminEnrollmentsView({ token, users, courses, reload }) {
  const learners = users.filter((u) => u.role === "student" && u.isActive !== false);
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const [sel, setSel] = useState({});
  const [sectionSel, setSectionSel] = useState({});
  const [teacherSel, setTeacherSel] = useState({});
  const [enrollMode, setEnrollMode] = useState({});
  const [sections, setSections] = useState([]);

  useEffect(() => {
    apiRequest("/admin/sections", { token }).then((data) => setSections(Array.isArray(data) ? data : [])).catch(() => {});
  }, [token]);

  async function enrollLearner(courseId) {
    if (!sel[courseId]) return;
    await apiRequest(`/admin/courses/${courseId}/enroll`, { method: "POST", token, body: { studentId: sel[courseId] } });
    setSel({ ...sel, [courseId]: "" });
    reload();
  }

  async function enrollSection(courseId) {
    const sectionName = sectionSel[courseId];
    if (!sectionName) return;
    await apiRequest(`/admin/courses/${courseId}/enroll-section`, { method: "POST", token, body: { sectionName } });
    setSectionSel({ ...sectionSel, [courseId]: "" });
    reload();
  }

  async function assignTeacher(courseId) {
    if (!teacherSel[courseId]) return;
    await apiRequest(`/admin/courses/${courseId}/assign-teacher`, { method: "POST", token, body: { teacherId: teacherSel[courseId] } });
    setTeacherSel({ ...teacherSel, [courseId]: "" });
    reload();
  }

  return (
    <section className="space-y-5 dn-page-enter" aria-label="Enrollment Management">
      <div className="dn-card p-5">
        <SectionHeader title="Enrollment Management" subtitle="Assign faculty and enroll learners by section or individually">
          <button className="dn-btn-secondary text-xs" onClick={() => downloadReport("/admin/reports/roster", "danilo-roster.csv", token)}>
            Export Roster
          </button>
          <button className="dn-btn-secondary text-xs" onClick={() => downloadReport("/admin/reports/grades", "danilo-grades.csv", token)}>
            Export Grades
          </button>
        </SectionHeader>

        <div className="space-y-3">
          {courses.length ? courses.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{c.code}</p>
                    <Badge tone="blue">{c.quarter}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.teacherName || "Unassigned"} &middot; {c.studentTotal ?? 0} learners
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex gap-2">
                  <select className="dn-input text-xs flex-1" value={teacherSel[c.id] || ""} onChange={(e) => setTeacherSel({ ...teacherSel, [c.id]: e.target.value })}>
                    <option value="">Assign faculty...</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                  <button className="dn-btn-secondary text-xs py-1.5 min-h-[36px] flex-shrink-0" onClick={() => assignTeacher(c.id)}>Assign</button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${enrollMode[c.id] !== "individual" ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-slate-200 text-slate-500"}`}
                      onClick={() => setEnrollMode({ ...enrollMode, [c.id]: "section" })}
                    >By Section</button>
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${enrollMode[c.id] === "individual" ? "bg-primary-50 border-primary-200 text-primary-700 font-medium" : "bg-white border-slate-200 text-slate-500"}`}
                      onClick={() => setEnrollMode({ ...enrollMode, [c.id]: "individual" })}
                    >Individual</button>
                  </div>
                  {enrollMode[c.id] === "individual" ? (
                    <div className="flex gap-2">
                      <select className="dn-input text-xs flex-1" value={sel[c.id] || ""} onChange={(e) => setSel({ ...sel, [c.id]: e.target.value })}>
                        <option value="">Enroll learner...</option>
                        {learners.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                      </select>
                      <button className="dn-btn-primary text-xs py-1.5 min-h-[36px] flex-shrink-0" onClick={() => enrollLearner(c.id)}>Enroll</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select className="dn-input text-xs flex-1" value={sectionSel[c.id] || ""} onChange={(e) => setSectionSel({ ...sectionSel, [c.id]: e.target.value })}>
                        <option value="">Select section...</option>
                        {sections.length === 0
                          ? <option disabled value="">No sections created yet</option>
                          : sections.map((s) => <option key={s.id} value={s.name}>{s.name} — {s.gradeLevel}</option>)
                        }
                      </select>
                      <button className="dn-btn-primary text-xs py-1.5 min-h-[36px] flex-shrink-0" onClick={() => enrollSection(c.id)}>Enroll</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <Empty title="No subjects" body="Create a subject first, then manage enrollment here." />
          )}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
   ADMIN: ANNOUNCEMENTS
   ======================================================================== */

export function AdminAnnouncementsView({ token, reload }) {
  const [form, setForm] = useState({ title: "", body: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    await apiRequest("/admin/announcements", { method: "POST", token, body: form });
    setForm({ title: "", body: "" });
    reload();
  }

  return (
    <section className="dn-page-enter" aria-label="System Announcements">
      <form className="dn-card p-5" onSubmit={handleSubmit}>
        <SectionHeader title="System Announcement" subtitle="Broadcast a message to all active classes" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Message">
            <textarea className="dn-input" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </Field>
          <div className="sm:col-span-2">
            <button className="dn-btn-warm">Broadcast Announcement</button>
          </div>
        </div>
      </form>
    </section>
  );
}

/* ========================================================================
   ADMIN: REPORTS
   ======================================================================== */

export function ReportsView({ token, dashboard }) {
  const t = dashboard?.totals || {};
  return (
    <section className="space-y-5 dn-page-enter" aria-label="Reports">
      <div className="dn-card p-5">
        <SectionHeader title="Reports & Analytics" subtitle="System-wide performance summary">
          <button className="dn-btn-secondary text-xs" onClick={() => downloadReport("/admin/reports/roster", "danilo-roster.csv", token)}>
            Export Roster CSV
          </button>
          <button className="dn-btn-secondary text-xs" onClick={() => downloadReport("/admin/reports/grades", "danilo-grades.csv", token)}>
            Export Grades CSV
          </button>
        </SectionHeader>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Learners" value={t.learners ?? t.students} accent />
          <Stat label="Faculty" value={t.faculty ?? t.teachers} />
          <Stat label="Classes" value={t.classes} />
          <Stat label="Enrollments" value={t.enrollments} />
          <Stat label="Modules" value={t.modules} />
          <Stat label="Grade Entries" value={t.grades} />
        </div>
      </div>
    </section>
  );
}
/* ========================================================================
   ADMIN: SYSTEM STATUS
   ======================================================================== */

export function SystemView({ token, addToast, dismissToast }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const ramToastId = React.useRef(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/system", { token });
      setStatus(data);
      setLastRefresh(new Date());

      if (data?.hardware?.ramPercent >= 85) {
        if (!ramToastId.current) {
          ramToastId.current = addToast("CRITICAL: System RAM is at or above 85%. Free up memory or decrease OLLAMA_NUM_CTX.", "danger");
        }
      } else if (ramToastId.current) {
        dismissToast(ramToastId.current);
        ramToastId.current = null;
      }
    } catch (err) {
      setError(err?.message || "Could not load system status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [token]);

  const s = status || {};
  const t = s.totals || {};
  const hw = s.hardware || {};

  const StatusDot = ({ value }) => {
    const ok = value === "connected" || value === "online";
    const warn = value === "degraded";
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
        ok ? "bg-success-50 text-success-700" : warn ? "bg-warm-50 text-warm-700" : "bg-red-50 text-red-700"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-success-500" : warn ? "bg-warm-400" : "bg-red-500"
        }`} />
        {value || "unknown"}
      </span>
    );
  };

  function GaugeBar({ pct, label, detail, warnAt = 70, critAt = 85 }) {
    if (pct === null || pct === undefined) return (
      <div className="rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-md p-4 text-center">
        <p className="dn-overline mb-1">{label}</p>
        <p className="text-xs text-slate-400">Unavailable</p>
      </div>
    );
    const isCrit = pct >= critAt;
    const isWarn = !isCrit && pct >= warnAt;
    const color = isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#10b981";
    const textColor = isCrit ? "text-red-600" : isWarn ? "text-warm-600" : "text-success-600";
    
    const r = 40;
    const c = Math.PI * r;
    const offset = c - (pct / 100) * c;

    return (
      <div className="rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-md p-4 flex flex-col items-center shadow-sm">
        <p className="dn-overline mb-4 tracking-widest">{label}</p>
        <div className="relative w-24 h-12 flex items-end justify-center">
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 50">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
          </svg>
          <span className={`absolute bottom-[-5px] text-xl font-bold ${textColor} leading-none`}>{pct}%</span>
        </div>
        {detail && <p className="text-[11px] text-slate-400 mt-5 font-medium uppercase tracking-wider">{detail}</p>}
      </div>
    );
  }

  return (
    <section className="space-y-5 dn-page-enter" aria-label="System Status">
      <div className="dn-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="dn-title">System Status</h2>
            <p className="dn-subtitle mt-0.5">Beelink N95 · Live health{lastRefresh ? ` · ${lastRefresh.toLocaleTimeString()}` : ""}</p>
          </div>
          <button onClick={load} disabled={loading} className="dn-btn-secondary text-xs flex items-center gap-1.5">
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}

        <div className="mb-5">
          <p className="dn-overline mb-3">Services</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="dn-overline mb-2">Database</p>
              <StatusDot value={s.database} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="dn-overline mb-2">AI (Ollama)</p>
              <StatusDot value={s.ollama} />
              {s.ollamaModel && <p className="text-[10px] text-slate-400 mt-1 truncate">{s.ollamaModel}</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="dn-overline mb-2">Wi-Fi SSID</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{s.wifiSsid || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="dn-overline mb-2">Portal URL</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{s.portalUrl || "—"}</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="dn-overline mb-3">Hardware (N95 · 8 GB RAM · CPU-only inference)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <GaugeBar pct={hw.cpuPercent} label="CPU" detail="Intel N95 · 4 cores" warnAt={75} critAt={90} />
            <GaugeBar
              pct={hw.ramPercent}
              label="System RAM"
              detail={hw.ramUsedMb && hw.ramTotalMb ? `${hw.ramUsedMb} / ${hw.ramTotalMb} MB` : null}
              warnAt={70}
              critAt={85}
            />
            <GaugeBar
              pct={hw.diskPercent}
              label="Disk"
              detail={hw.diskUsedGb && hw.diskTotalGb ? `${hw.diskUsedGb} / ${hw.diskTotalGb} GB` : null}
              warnAt={75}
              critAt={90}
            />
          </div>
          {hw.ramPercent >= 85 && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-red-500 mt-0.5">⚠</span>
              <p className="text-xs text-red-700 font-medium">RAM usage is critically high ({hw.ramPercent}%). The AI model may become unresponsive. Consider reducing <code>OLLAMA_NUM_CTX</code> or restarting the Ollama service.</p>
            </div>
          )}
        </div>

        <div>
          <p className="dn-overline mb-3">Platform Totals</p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Learners" value={t.learners} accent />
            <Stat label="Faculty" value={t.faculty} />
            <Stat label="Active Classes" value={t.classes} />
            <Stat label="Sections" value={t.sections} />
            <Stat label="Departments" value={t.departments} />
            <Stat label="Enrollments" value={t.enrollments} />
            <Stat label="Modules" value={t.modules} />
            <Stat label="Chat Sessions" value={t.chatSessions} />
            <Stat label="Chat Messages" value={t.chatMessages} />
          </div>
        </div>
      </div>
      {(s.ollamaAvailableModels || []).length > 0 && (
        <div className="dn-card p-5">
          <SectionHeader title="Available AI Models" subtitle="Ollama model registry" />
          <div className="flex flex-wrap gap-2 mt-2">
            {s.ollamaAvailableModels.map((m) => (
              <span key={m} className={`px-3 py-1 rounded-full text-xs font-medium border ${
                m === s.ollamaModel ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>{m}{m === s.ollamaModel ? " ✓" : ""}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================================================
   ADMIN: ASSIGNMENTS OVERVIEW
   ======================================================================== */

export function AdminAssignmentsView({ assignments }) {
  return (
    <section className="dn-page-enter" aria-label="Assignments">
      <div className="dn-card p-5">
        <SectionHeader title="All Assignments" subtitle={`${(assignments || []).length} assignments across all classes`} />
        {assignments?.length ? (
          <div className="space-y-2">
            {assignments.map((a) => (
              <article key={a.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 hover:bg-white transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {a.courseCode || a.courseTitle} &middot; {a.points} pts &middot;{" "}
                      <Badge tone={a.status === "completed" ? "green" : a.status === "submitted" ? "blue" : "default"}>
                        {a.status || "open"}
                      </Badge>
                    </p>
                  </div>
                </div>
                {a.instructions && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{a.instructions}</p>}
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No assignments" body="Assignments appear here once teachers create them." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   ADMIN: DEPARTMENTS
   ======================================================================== */

export function DepartmentsView({ token, users, reload }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "", headId: "" });
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  const faculty = users.filter((u) => u.role === "teacher" && u.isActive !== false);

  async function loadDepts() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/departments", { token });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (_) {} finally { setLoading(false); }
  }

  useEffect(() => { loadDepts(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, headId: form.headId ? Number(form.headId) : null };
    if (edit) {
      await apiRequest(`/admin/departments/${edit.id}`, { method: "PUT", token, body: payload });
      setEdit(null);
    } else {
      await apiRequest("/admin/departments", { method: "POST", token, body: payload });
    }
    setForm({ name: "", code: "", description: "", headId: "" });
    loadDepts();
    reload();
  }

  async function deactivate(id) {
    await apiRequest(`/admin/departments/${id}`, { method: "DELETE", token });
    loadDepts();
  }

  function startEdit(d) {
    setEdit(d);
    setForm({ name: d.name, code: d.code, description: d.description || "", headId: d.headId || "" });
  }

  return (
    <section className="space-y-5 dn-page-enter" aria-label="Departments">
      <div className="dn-card p-5">
        <SectionHeader
          title={edit ? "Edit Department" : "New Department"}
          subtitle="Manage learning area departments"
        />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Department Name">
            <input className="dn-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Mathematics" />
          </Field>
          <Field label="Code">
            <input className="dn-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g. MATH" maxLength={20} />
          </Field>
          <Field label="Department Head">
            <select className="dn-input" value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value })}>
              <option value="">No head assigned</option>
              {faculty.map((f) => <option key={f.id} value={f.id}>{f.fullName}</option>)}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input className="dn-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </Field>
          <div className="flex items-end gap-2">
            <button className="dn-btn-primary w-full">{edit ? "Save Changes" : "Create Department"}</button>
            {edit && (
              <button type="button" className="dn-btn-secondary" onClick={() => { setEdit(null); setForm({ name: "", code: "", description: "", headId: "" }); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="Departments" subtitle={departments.length ? `${departments.filter((d) => d.isActive).length} active` : "No departments yet"} />
        {loading ? (
          <div className="text-center py-6 text-sm text-slate-400">Loading...</div>
        ) : departments.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <div key={d.id} className={`rounded-xl border p-4 transition-all ${d.isActive ? "border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="blue">{d.code}</Badge>
                  {!d.isActive && <Badge tone="red">Inactive</Badge>}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{d.name}</h3>
                {d.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.description}</p>}
                {d.headId && (
                  <p className="text-xs text-slate-400 mt-1">
                    Head: {faculty.find((f) => f.id === d.headId)?.fullName || `ID ${d.headId}`}
                  </p>
                )}
                <div className="flex gap-1.5 mt-3">
                  <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(d)}>Edit</button>
                  {d.isActive && (
                    <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={() => deactivate(d.id)}>Deactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No departments" body="Create departments to organize learning areas and assign faculty heads." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   TEACHER: ANNOUNCEMENTS (Post to own classes)
   ======================================================================== */

export function TeacherAnnouncementsView({ token, courses, reload }) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [form, setForm] = useState({ title: "", body: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!courseId) return;
    await apiRequest(`/teacher/courses/${courseId}/announcements`, { method: "POST", token, body: form });
    setForm({ title: "", body: "" });
    reload();
  }

  return (
    <section className="dn-page-enter" aria-label="Announcements">
      <form className="dn-card p-5" onSubmit={handleSubmit}>
        <SectionHeader title="Post Announcement" subtitle="Send a message to your class" />
        <div className="grid gap-3">
          <Field label="Class">
            <select className="dn-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
          </Field>
          <Field label="Title">
            <input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Message">
            <textarea className="dn-input" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </Field>
          <button className="dn-btn-warm">Post Announcement</button>
        </div>
      </form>
    </section>
  );
}
EOF

  cat > "${APP_ROOT}/frontend/src/App.jsx" <<'EOF'
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, apiUpload } from "./api";
import { AdminAssignmentsView, AdminAnnouncementsView, AdminClassesView, AdminEnrollmentsView, AdminUsersView, DepartmentsView, ReportsView, SystemView, TeacherAnnouncementsView } from "./components/AdminPages";
import { ASSESSMENT_TYPES, Empty, Field } from "./components/shared";
import ContentView from "./components/ContentView";
import GradesView from "./components/GradesView";
import InstallBanner from "./components/InstallBanner";
import LoginView from "./components/LoginView";
import StreamView from "./components/StreamView";
import TutorView from "./components/TutorView";


function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((to) => {
    if (to !== window.location.pathname) {
      window.history.pushState(null, "", to);
      setPath(to);
    }
  }, []);
  return [path, navigate];
}

function matchRoute(path) {
  const p = path.replace(/\/+$/, "") || "/";
  const classMatch = p.match(/^\/class\/(\d+)\/(stream|classwork|people|grades)$/);
  if (classMatch) return { page: "class-detail", classId: Number(classMatch[1]), tab: classMatch[2] };
  const classBase = p.match(/^\/class\/(\d+)$/);
  if (classBase) return { page: "class-detail", classId: Number(classBase[1]), tab: "stream" };
  const routes = {
    "/": "overview", "/overview": "overview", "/my-classes": "my-classes",
    "/users": "users", "/classes": "classes", "/sections": "sections",
    "/enrollments": "enrollments", "/assignments": "assignments",
    "/grades": "grades", "/reports": "reports", "/settings": "settings",
    "/system": "system", "/ai-tutor": "ai-tutor", "/announcements": "announcements",
  };
  return { page: routes[p] || "not-found" };
}

function getInitials(name) {
  return (name || "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";
}

/* ========================================================================
   ICONS
   ======================================================================== */

const I = (d, sw = 1.5) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const Icons = {
  home:     I("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"),
  lessons:  I("M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"),
  grades:   I("M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"),
  tutor:    I("M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"),
  logout:   I("M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75", 2),
  users:    I("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
  classes:  I("M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"),
  enroll:   I("M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"),
  reports:  I("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"),
  system:   I("M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"),
  announce: I("M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 008.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"),
  assign:   I("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"),
};


/* ========================================================================
   NAVIGATION CONFIG
   ======================================================================== */

const NAV = {
  student: [
    { path: "/overview",    label: "Home",       icon: Icons.home,    page: "overview" },
    { path: "/my-classes",  label: "My Classes", icon: Icons.classes, page: "my-classes" },
    { path: "/grades",      label: "Grades",     icon: Icons.grades,  page: "grades" },
    { path: "/ai-tutor",   label: "AI Tutor",   icon: Icons.tutor,   page: "ai-tutor" },
  ],
  teacher: [
    { path: "/overview",     label: "Overview",      icon: Icons.home,     page: "overview" },
    { path: "/my-classes",   label: "My Classes",    icon: Icons.classes,  page: "my-classes" },
    { path: "/grades",       label: "Gradebook",     icon: Icons.grades,   page: "grades" },
    { path: "/announcements", label: "Announce",     icon: Icons.announce, page: "announcements" },
    { path: "/ai-tutor",    label: "AI Assistant",  icon: Icons.tutor,    page: "ai-tutor" },
  ],
  admin: [
    { path: "/overview",     label: "Overview",     icon: Icons.home,    page: "overview" },
    { path: "/users",        label: "Users",        icon: Icons.users,   page: "users" },
    { path: "/classes",      label: "Subjects",     icon: Icons.classes, page: "classes" },
    { path: "/enrollments",  label: "Enrollments",  icon: Icons.enroll,  page: "enrollments" },
    { path: "/assignments",  label: "Assignments",  icon: Icons.assign,  page: "assignments" },
    { path: "/grades",       label: "Grades",       icon: Icons.grades,  page: "grades" },
    { path: "/departments",  label: "Departments",  icon: Icons.users,   page: "departments" },
    { path: "/reports",      label: "Reports",      icon: Icons.reports, page: "reports" },
    { path: "/system",       label: "System",       icon: Icons.system,  page: "system" },
    { path: "/ai-tutor",    label: "AI Tutor",     icon: Icons.tutor,   page: "ai-tutor" },
  ],
};
const getNav = (role) => NAV[role] || NAV.student;

const ALLOWED = {
  admin:   ["overview", "users", "classes", "sections", "enrollments", "assignments", "grades", "departments", "reports", "settings", "system", "ai-tutor", "my-classes", "announcements", "class-detail", "not-found"],
  teacher: ["overview", "my-classes", "grades", "announcements", "ai-tutor", "class-detail", "not-found"],
  student: ["overview", "my-classes", "grades", "ai-tutor", "class-detail", "not-found"],
};
function isAllowed(role, page) {
  return (ALLOWED[role] || ALLOWED.student).includes(page);
}

const initialLogin = { username: "", password: "" };
const initialTutor = { moduleId: "", question: "", responseMode: "normal" };
let nextMsgId = 1;

function createBootstrapDashboard(user) {
  return {
    user,
    stream: [],
    courses: [],
    contentFolders: [],
    grades: [],
    hints: { hasContent: false, hasCourses: false, hasGrades: false, hasStream: false },
    contentWorkflow: null,
    network: null,
    operationsHighlights: [],
  };
}


/* ========================================================================
   SIDEBAR (Desktop)
   ======================================================================== */

function Sidebar({ user, currentPage, navigate, onLogout, dashboard }) {
  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-warm-500", student: "bg-accent-600" };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-[260px] lg:border-r lg:border-slate-200 bg-white">
      <div className="flex flex-col h-full px-4 py-5">

        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] leading-none">Project</p>
            <p className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">DANILO</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 mb-5">
          <div className="flex items-center gap-2">
            <span className="dn-status-dot dn-status-dot-pulse" />
            <span className="text-xs font-medium text-success-600">Network Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 ml-4">Offline AI Ready</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = currentPage === tab.page;
            return (
              <button key={tab.path} type="button" onClick={() => navigate(tab.path)}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <span className={`transition-colors ${isActive ? "text-primary-500" : "text-slate-400 group-hover:text-slate-500"}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {dashboard?.operationsHighlights && dashboard.operationsHighlights.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 mb-4 space-y-1.5">
            {dashboard.operationsHighlights.slice(0, 2).map((item) => (
              <div key={item.label}>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-medium text-slate-700 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className={`w-8 h-8 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
            {Icons.logout}
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}


/* ========================================================================
   MOBILE TOP BAR
   ======================================================================== */

function MobileTopBar({ user, currentPage, onMenuOpen }) {
  const tabs = getNav(user.role);
  const currentTab = tabs.find((t) => t.page === currentPage);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-warm-500", student: "bg-accent-600" };

  return (
    <header className="lg:hidden fixed top-0 inset-x-0 z-40 border-b border-slate-200/80"
      style={{ background: "rgba(248,250,252,0.85)", backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)" }}>
      <div className="flex items-center justify-between px-3 h-[56px]">
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 active:scale-95 active:bg-slate-100 transition"
            aria-label="Open navigation menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900 tracking-tight">{currentTab ? currentTab.label : "DANILO"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-success-50 border border-success-200">
            <span className="dn-status-dot" style={{ width: 5, height: 5 }} />
            <span className="text-[11px] font-medium text-success-600">Online</span>
          </div>
          <button type="button" onClick={onMenuOpen}
            className={`w-8 h-8 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center`}
            title={`Open menu (${user.fullName})`}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}


/* ========================================================================
   MOBILE DRAWER
   ======================================================================== */

function MobileDrawer({ open, user, currentPage, navigate, onClose, onLogout, dashboard }) {
  const tabs = getNav(user.role);
  const initials = getInitials(user.fullName);
  const roleTone = { admin: "bg-primary-600", teacher: "bg-warm-500", student: "bg-accent-600" };

  function choose(path) {
    navigate(path);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Close navigation menu" />
      <aside className="absolute inset-y-0 left-0 w-[min(84vw,320px)] bg-white shadow-xl border-r border-slate-100 p-4 flex flex-col animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full ${roleTone[user.role] || roleTone.student} flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-lg text-slate-500 active:scale-95 active:bg-slate-100 transition" aria-label="Close">
            <svg className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="dn-status-dot" />
            <span className="text-xs font-medium text-success-600">Network Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{dashboard?.network?.ssid || "DANILO"} &middot; Offline-ready</p>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {tabs.map((tab) => {
            const isActive = currentPage === tab.page;
            return (
              <button key={tab.path} type="button" onClick={() => choose(tab.path)}
                className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 text-sm font-medium active:scale-[0.99] transition ${
                  isActive ? "bg-primary-50 text-primary-700" : "text-slate-600 active:bg-slate-50"
                }`}>
                <span className={isActive ? "text-primary-500" : "text-slate-400"}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button type="button" onClick={() => { onClose(); onLogout(); }}
          className="mt-4 min-h-[44px] w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 active:scale-[0.99] active:bg-slate-50 transition">
          Sign Out
        </button>
      </aside>
    </div>
  );
}


/* ========================================================================
   MOBILE BOTTOM NAV
   ======================================================================== */

function MobileBottomNav({ currentPage, navigate, role }) {
  const tabs = getNav(role).slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
      <div className="flex items-stretch justify-around"
        style={{ paddingBottom: "calc(4px + env(safe-area-inset-bottom, 0px))", paddingTop: "4px" }}>
        {tabs.map((tab) => {
          const isActive = currentPage === tab.page;
          return (
            <button key={tab.path} type="button" onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 flex-1 transition-all duration-150 ${
                isActive ? "text-primary-600" : "text-slate-400 active:scale-90"
              }`}>
              {isActive && <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary-600" />}
              <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>{tab.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary-600" : "text-slate-400"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


/* ========================================================================
   HOME VIEW
   ======================================================================== */

function AdminSetupChecklist({ dashboard, onNavigate }) {
  const t = dashboard.totals || {};
  const learners = t.learners ?? 0;
  const faculty  = t.faculty  ?? 0;
  const sections = t.sections ?? 0;
  const subjects = t.classes  ?? 0;

  const steps = [
    { done: sections > 0,  label: "Create Sections",    sub: "Add your school's class sections",          path: "/sections",    nav: "/sections"    },
    { done: faculty > 0,   label: "Add Faculty",         sub: "Create faculty accounts",                   path: "/users",       nav: "/users"       },
    { done: subjects > 0,  label: "Create Subjects",     sub: "Set up subject records for each quarter",   path: "/classes",     nav: "/classes"     },
    { done: learners > 0,  label: "Enroll Learners",     sub: "Add learner accounts — auto-inherit applies", path: "/users",     nav: "/users"       },
  ];
  const allDone = steps.every((s) => s.done);

  if (allDone) return null;

  return (
    <div className="dn-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">School Setup Checklist</p>
          <p className="text-xs text-slate-400">Complete these steps to get DANILO ready for learners</p>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => onNavigate(s.nav)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${s.done ? "bg-success-50 border-success-200" : "bg-white border-slate-200 hover:border-primary-200 hover:bg-primary-50/50"}`}>
            <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${s.done ? "bg-success-500 border-success-500 text-white" : "border-slate-300 text-slate-400"}`}>
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-success-700 line-through" : "text-slate-800"}`}>{s.label}</p>
              <p className="text-[11px] text-slate-400 truncate">{s.sub}</p>
            </div>
            {!s.done && <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeView({ user, dashboard, onNavigate }) {
  const courseCount = Array.isArray(dashboard.courses) ? dashboard.courses.length : 0;
  const lessonCount = Array.isArray(dashboard.contentFolders) ? dashboard.contentFolders.length : 0;
  const streamCount = Array.isArray(dashboard.stream) ? dashboard.stream.length : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="space-y-5 animate-fade-in">
      <div className="dn-card p-5 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-slate-500 text-sm">{greeting},</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{user.fullName}</h2>
          </div>
          <span className="dn-badge bg-primary-50 text-primary-700 capitalize">{user.displayRole || user.role}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="dn-status-dot dn-status-dot-pulse" />
            <span className="text-success-600 font-medium text-xs">{dashboard.network?.ssid || "DANILO"}</span>
          </div>
          <span className="text-slate-300">&middot;</span>
          <span className="text-xs">{dashboard.network?.mode || "offline-first"}</span>
        </div>
      </div>

      {user.role === "admin" && <AdminSetupChecklist dashboard={dashboard} onNavigate={onNavigate} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="dn-card p-4 text-center">
          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-2 text-primary-500">{Icons.classes}</div>
          <p className="text-xl font-bold text-primary-600">{courseCount}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Subjects</p>
        </div>
        <div className="dn-card p-4 text-center">
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2 text-purple-500">{Icons.lessons}</div>
          <p className="text-xl font-bold text-purple-600">{lessonCount}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Lessons</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          {streamCount > 0 && (
            <button onClick={() => onNavigate("/my-classes")} className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
              View all &rarr;
            </button>
          )}
        </div>
        {streamCount === 0 ? (
          <Empty title="No recent activity" body="Posts from your faculty will appear here" icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        ) : (
          <div className="space-y-2">
            {dashboard.stream.slice(0, 4).map((item) => (
              <div key={item.id} className="dn-card p-3.5 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.courseTitle} &middot; {item.authorName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


/* ========================================================================
   MY CLASSES VIEW
   ======================================================================== */

function MyClassesView({ courses, navigate }) {
  const COLORS = ["from-primary-500 to-primary-600", "from-purple-500 to-purple-600", "from-accent-500 to-accent-600", "from-warm-500 to-warm-600", "from-danger-500 to-danger-600"];
  return (
    <section className="animate-fade-in" aria-label="My Classes">
      <div className="mb-5">
        <h2 className="dn-title">My Subjects</h2>
        <p className="dn-subtitle mt-0.5">Your enrolled subjects. Tap a card to open.</p>
      </div>
      {!courses || courses.length === 0 ? (
        <Empty title="No subjects yet" body="You will see your enrolled subjects here once assigned." icon={Icons.classes} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <button key={c.id} onClick={() => navigate(`/class/${c.id}/stream`)}
              className="group text-left dn-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`h-20 bg-gradient-to-br ${COLORS[i % COLORS.length]} relative`}>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm truncate drop-shadow-sm">{c.title}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.code}</p>
                <p className="text-sm text-slate-400 mt-0.5">{c.subject} &middot; {c.gradeLevel}</p>
                {c.teacherName && <p className="text-xs text-slate-400 mt-0.5">{c.teacherName}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}


/* ========================================================================
   TEACHER QUICK TOOLS
   ======================================================================== */

function TeacherQuickTools({ token, user, course, tab, people, reload }) {
  const [moduleForm, setModuleForm] = useState({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", instructions: "", points: 100 });
  const [gradeForm, setGradeForm] = useState({ studentId: "", quarter: course.quarter || "Q1", component: "", score: "", maxScore: 100, weight: 1, remarks: "" });
  const [uploadState, setUploadState] = useState({ file: null, saving: false, error: "", success: "" });

  if (user.role !== "teacher") return null;

  async function createModule(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/modules`, { method: "POST", token, body: moduleForm });
    setModuleForm({ title: "", melcCode: "", learningCompetency: "", lessonObjectives: "", assessmentType: "", quarter: course.quarter || "Q1", week: 1, summary: "" });
    reload();
  }

  async function createAssignment(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/assignments`, { method: "POST", token, body: assignmentForm });
    setAssignmentForm({ title: "", instructions: "", points: 100 });
    reload();
  }

  async function createGrade(e) {
    e.preventDefault();
    await apiRequest(`/teacher/courses/${course.id}/grades`, { method: "POST", token, body: gradeForm });
    setGradeForm({ studentId: "", quarter: course.quarter || "Q1", component: "", score: "", maxScore: 100, weight: 1, remarks: "" });
    reload();
  }

  async function generateLesson(e) {
    e.preventDefault();
    if (!uploadState.file) return;
    const formData = new FormData();
    formData.append("material", uploadState.file);
    setUploadState((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const result = await apiUpload(`/teacher/courses/${course.id}/materials/generate?save=true`, { token, formData });
      setUploadState({ file: null, saving: false, error: "", success: result?.message || "Lesson draft generated and saved." });
      await reload();
    } catch (error) {
      setUploadState((prev) => ({ ...prev, saving: false, error: error?.message || "Material could not be processed.", success: "" }));
    }
  }

  if (tab === "classwork") {
    return (
      <div className="grid gap-4 mb-5 lg:grid-cols-2">
        <form className="dn-card p-5" onSubmit={createModule}>
          <h3 className="font-semibold text-slate-900 mb-3">Add Lesson Module</h3>
          <div className="grid gap-3">
            <Field label="Module Title"><input className="dn-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required /></Field>
            <Field label="MELC Code"><input className="dn-input" value={moduleForm.melcCode} onChange={(e) => setModuleForm({ ...moduleForm, melcCode: e.target.value })} /></Field>
            <Field label="Learning Competency"><textarea className="dn-input" rows={2} value={moduleForm.learningCompetency} onChange={(e) => setModuleForm({ ...moduleForm, learningCompetency: e.target.value })} /></Field>
            <Field label="Lesson Objectives"><textarea className="dn-input" rows={2} value={moduleForm.lessonObjectives} onChange={(e) => setModuleForm({ ...moduleForm, lessonObjectives: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quarter"><select className="dn-input" value={moduleForm.quarter} onChange={(e) => setModuleForm({ ...moduleForm, quarter: e.target.value })}><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></Field>
              <Field label="Week"><input className="dn-input" type="number" min="1" value={moduleForm.week} onChange={(e) => setModuleForm({ ...moduleForm, week: e.target.value })} /></Field>
            </div>
            <Field label="Assessment Type"><select className="dn-input" value={moduleForm.assessmentType} onChange={(e) => setModuleForm({ ...moduleForm, assessmentType: e.target.value })}><option value="">Optional</option>{ASSESSMENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Summary"><textarea className="dn-input" rows={2} value={moduleForm.summary} onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })} /></Field>
            <button className="dn-btn-primary">Add Module</button>
          </div>
        </form>
        <form className="dn-card p-5" onSubmit={createAssignment}>
          <h3 className="font-semibold text-slate-900 mb-3">Create Assignment</h3>
          <div className="grid gap-3">
            <Field label="Title"><input className="dn-input" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required /></Field>
            <Field label="Instructions"><textarea className="dn-input" rows={5} value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} required /></Field>
            <Field label="Points"><input className="dn-input" type="number" min="1" value={assignmentForm.points} onChange={(e) => setAssignmentForm({ ...assignmentForm, points: e.target.value })} /></Field>
            <button className="dn-btn-warm">Create Assignment</button>
          </div>
        </form>
        <form className="dn-card p-5 lg:col-span-2" onSubmit={generateLesson}>
          <h3 className="font-semibold text-slate-900 mb-3">Generate Lesson From Material</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Upload PDF, PPT, PPTX, DOCX, or TXT">
              <input className="dn-input" type="file" accept=".pdf,.ppt,.pptx,.docx,.txt"
                onChange={(e) => setUploadState({ file: e.target.files?.[0] || null, saving: false, error: "", success: "" })} />
            </Field>
            <button className="dn-btn-primary" disabled={!uploadState.file || uploadState.saving}>
              {uploadState.saving ? "Generating..." : "Generate Lesson"}
            </button>
          </div>
          {uploadState.error && <p className="mt-3 text-sm font-medium text-danger-600">{uploadState.error}</p>}
          {uploadState.success && <p className="mt-3 text-sm font-medium text-success-600">{uploadState.success}</p>}
        </form>
      </div>
    );
  }

  if (tab === "grades") {
    return (
      <form className="dn-card p-5 mb-5" onSubmit={createGrade}>
        <h3 className="font-semibold text-slate-900 mb-3">Add Grade</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Student"><select className="dn-input" value={gradeForm.studentId} onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })} required><option value="">Select learner...</option>{(people?.students || []).map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></Field>
          <Field label="Quarter"><select className="dn-input" value={gradeForm.quarter} onChange={(e) => setGradeForm({ ...gradeForm, quarter: e.target.value })}><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></Field>
          <Field label="Component"><input className="dn-input" value={gradeForm.component} onChange={(e) => setGradeForm({ ...gradeForm, component: e.target.value })} required /></Field>
          <Field label="Score"><input className="dn-input" type="number" min="0" step="0.01" value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} required /></Field>
          <Field label="Max Score"><input className="dn-input" type="number" min="1" step="0.01" value={gradeForm.maxScore} onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })} /></Field>
          <Field label="Weight"><input className="dn-input" type="number" min="0.01" step="0.01" value={gradeForm.weight} onChange={(e) => setGradeForm({ ...gradeForm, weight: e.target.value })} /></Field>
          <Field label="Remarks" className="sm:col-span-2"><input className="dn-input" value={gradeForm.remarks} onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })} /></Field>
          <div className="flex items-end"><button className="dn-btn-primary w-full">Add Grade</button></div>
        </div>
      </form>
    );
  }

  return null;
}


/* ========================================================================
   CLASS DETAIL VIEW
   ======================================================================== */

function ClassDetailView({ classId, tab, courses, dashboard, navigate, token, user, reloadData }) {
  const course = (courses || []).find((c) => c.id === classId);
  const [classData, setClassData] = useState({ loading: false, error: "", stream: null, classwork: null, people: null, grades: null });
  const TABS = [
    { id: "stream", label: "Stream", path: `/class/${classId}/stream` },
    { id: "classwork", label: "Classwork", path: `/class/${classId}/classwork` },
    { id: "people", label: "People", path: `/class/${classId}/people` },
    { id: "grades", label: "Grades", path: `/class/${classId}/grades` },
  ];

  useEffect(() => {
    if (!course || !token) return;
    let active = true;
    setClassData((prev) => ({ ...prev, loading: true, error: "" }));
    async function loadClassTab() {
      try {
        const [tabPayload, peoplePayload] = await Promise.all([
          apiRequest(`/classes/${classId}/${tab}`, { token }),
          apiRequest(`/classes/${classId}/people`, { token }).catch(() => null),
        ]);
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: "", [tab]: tabPayload, people: peoplePayload || prev.people }));
      } catch (error) {
        if (!active) return;
        setClassData((prev) => ({ ...prev, loading: false, error: error?.message || "Class data could not be loaded." }));
      }
    }
    loadClassTab();
    return () => { active = false; };
  }, [classId, tab, course, token]);

  async function refreshClass() {
    await reloadData();
    const payload = await apiRequest(`/classes/${classId}/${tab}`, { token });
    const peoplePayload = await apiRequest(`/classes/${classId}/people`, { token }).catch(() => classData.people);
    setClassData((prev) => ({ ...prev, [tab]: payload, people: peoplePayload }));
  }

  if (!course) {
    return (
      <section className="animate-fade-in text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">{Icons.classes}</div>
        <h2 className="text-lg font-semibold text-slate-900">Class not found</h2>
        <p className="text-sm text-slate-400 mt-1">This class does not exist or you are not enrolled.</p>
        <button onClick={() => navigate("/my-classes")} className="mt-4 dn-btn-primary">Back to My Classes</button>
      </section>
    );
  }

  const stream = Array.isArray(classData.stream) ? classData.stream : (dashboard?.stream || []).filter((s) => s.courseId === classId);
  const classwork = classData.classwork || {};
  const content = classwork.modules || (dashboard?.contentFolders || []).filter((f) => f.courseId === classId);
  const assignments = classwork.assignments || [];
  const gradePayload = classData.grades || {};
  const grades = gradePayload.grades || (dashboard?.grades || []).filter((g) => g.courseId === classId);
  const people = classData.people || { teacher: course.teacherName ? { fullName: course.teacherName } : null, students: [] };

  return (
    <section className="animate-fade-in">
      <button onClick={() => navigate("/my-classes")} className="flex items-center gap-1 text-sm text-primary-600 font-medium mb-4 hover:text-primary-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        My Classes
      </button>
      <div className="dn-card p-4 mb-4">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{course.title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{course.code} &middot; {course.subject} &middot; {course.gradeLevel}</p>
      </div>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
        <div className="flex min-w-max gap-1 sm:min-w-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => navigate(t.path)}
              className={`min-h-[40px] min-w-[96px] flex-1 rounded-md px-4 text-center text-sm font-medium transition-all active:scale-[0.98] ${
                tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {classData.loading && <div className="dn-card p-4 mb-4 text-sm text-slate-500">Loading class data...</div>}
      {classData.error && <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 mb-4 text-sm font-medium text-danger-600">{classData.error}</div>}
      <TeacherQuickTools token={token} user={user} course={course} tab={tab} people={people} reload={refreshClass} />
      {tab === "stream" && <StreamView items={stream} />}
      {tab === "classwork" && (
        <>
          <ContentView items={content} search="" onSearchChange={() => {}} quarter="" onQuarterChange={() => {}} subject="" onSubjectChange={() => {}} workflow={null} />
          <div className="mt-4 dn-card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Assignments</h3>
            {assignments.length ? assignments.map((a) => (
              <article key={a.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 mb-2">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{a.instructions}</p>
                <p className="text-xs text-slate-400 mt-1">{a.points} pts</p>
              </article>
            )) : <Empty title="No assignments" body="Assignments for this class will appear here." />}
          </div>
        </>
      )}
      {tab === "people" && (
        <div className="dn-card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Faculty</h3>
          <p className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">{people.teacher?.fullName || "Unassigned"}</p>
          <h3 className="font-semibold text-slate-900 mt-5 mb-3">Learners</h3>
          {people.students?.length ? (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
              {people.students.map((s) => <div key={s.id} className="p-3 text-sm"><p className="font-medium text-slate-700">{s.fullName}</p><p className="text-xs text-slate-400">{s.username}</p></div>)}
            </div>
          ) : (
            <Empty title="No enrolled learners" body="Learners will appear here after enrollment." />
          )}
        </div>
      )}
      {tab === "grades" && <GradesView grades={grades} />}
    </section>
  );
}


/* ========================================================================
   ERROR PAGES
   ======================================================================== */

function ForbiddenView({ navigate }) {
  return (
    <section className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">You do not have permission to view this page.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Overview</button>
    </section>
  );
}

function NotFoundView({ navigate }) {
  return (
    <section className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Page Not Found</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">The page you are looking for does not exist.</p>
      <button onClick={() => navigate("/overview")} className="mt-5 dn-btn-primary">Go to Overview</button>
    </section>
  );
}


/* ========================================================================
   MAIN APP
   ======================================================================== */

/* ========================================================================
   TOAST NOTIFICATION SYSTEM
   ======================================================================== */

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md pointer-events-auto transform transition-all animate-slide-left text-sm ${
            t.type === "success" ? "bg-success-50/90 border-success-200 text-success-800" :
            t.type === "error"   ? "bg-danger-50/90 border-danger-200 text-danger-800" :
            t.type === "danger"  ? "bg-red-600/90 border-red-700 text-white animate-pulse shadow-red-600/20" :
            "bg-white/90 border-slate-200 text-slate-800"
          }`}>
          <div className="flex-1 font-medium">{t.message}</div>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}


/* ========================================================================
   CONFIRMATION DIALOG
   ======================================================================== */

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, variant }) {
  if (!open) return null;
  const isDestructive = variant === "danger";
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} aria-label="Cancel" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm animate-fade-in">
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700"}`}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [path, navigate] = usePath();
  const [token, setToken]               = useState(() => localStorage.getItem("danilo.token") || "");
  const [user, setUser]                 = useState(null);
  const [dashboard, setDashboard]       = useState(null);
  const [adminUsers, setAdminUsers]     = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminAssignments, setAdminAssignments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [loginError, setLoginError]     = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [loginForm, setLoginForm]       = useState(initialLogin);
  const [promptEvent, setPromptEvent]   = useState(null);
  const [search, setSearch]             = useState("");
  const [quarter, setQuarter]           = useState("");
  const [subject, setSubject]           = useState("");
  const [tutorForm, setTutorForm]       = useState(initialTutor);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null, confirmLabel: "Confirm", variant: "default" });

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    if (type !== "danger") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const confirm = useCallback((title, message, onConfirm, opts = {}) => {
    setConfirmState({ open: true, title, message, onConfirm, confirmLabel: opts.confirmLabel || "Confirm", variant: opts.variant || "default" });
  }, []);
  const closeConfirm = useCallback(() => setConfirmState((c) => ({ ...c, open: false })), []);

  const deferredSearch = useDeferredValue(search);
  const route = useMemo(() => matchRoute(path), [path]);

  useEffect(() => {
    const handler = (event) => { event.preventDefault(); setPromptEvent(event); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);


  async function loadRoleData(authToken, profile) {
    const mergeDash = (incoming) => setDashboard((prev) => ({ ...(prev || {}), ...incoming }));

    if (profile.role === "admin") {
      const results = await Promise.allSettled([
        apiRequest("/admin/overview", { token: authToken }),
        apiRequest("/admin/users", { token: authToken }),
        apiRequest("/admin/courses", { token: authToken }),
        apiRequest("/admin/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminUsers(results[1].value);
      if (results[2].status === "fulfilled") setAdminCourses(results[2].value);
      if (results[3].status === "fulfilled") setAdminAssignments(results[3].value);
    } else if (profile.role === "teacher") {
      const results = await Promise.allSettled([
        apiRequest("/teacher/dashboard", { token: authToken }),
        apiRequest("/teacher/courses", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminCourses(results[1].value);
    } else {
      const results = await Promise.allSettled([
        apiRequest("/dashboard", { token: authToken }),
        apiRequest("/student/assignments", { token: authToken }),
      ]);
      if (results[0].status === "fulfilled") mergeDash(results[0].value);
      if (results[1].status === "fulfilled") setAdminAssignments(results[1].value);
    }
  }

  async function reloadData() {
    if (!token || !user) return;
    try { await loadRoleData(token, user); } catch { /* silent */ }
  }


  useEffect(() => {
    if (!token) return;
    let active = true;
    setSessionLoading(true);
    setDashboardError("");

    async function restoreSession() {
      try {
        const profile = await apiRequest("/me", { token });
        if (!active) return;
        setUser(profile);
        setDashboard((c) => c || createBootstrapDashboard(profile));
        try {
          await loadRoleData(token, profile);
        } catch (error) {
          if (!active) return;
          if (error?.status === 401) {
            localStorage.removeItem("danilo.token");
            setToken(""); setUser(null); setDashboard(null);
            setLoginError("Your session expired. Please sign in again.");
            return;
          }
          setDashboard(createBootstrapDashboard(profile));
          setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          localStorage.removeItem("danilo.token");
          setToken(""); setUser(null); setDashboard(null);
          setLoginError("Your session expired. Please sign in again.");
          return;
        }
        setDashboardError(error?.message || "Unable to restore your session.");
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    restoreSession();
    return () => { active = false; };
  }, [token]);


  const filteredContent = (dashboard?.contentFolders || []).filter((item) => {
    const matchesSearch = !deferredSearch ||
      [item.title, item.summary, item.folderName, item.subject].join(" ").toLowerCase().includes(deferredSearch.toLowerCase());
    const matchesQuarter = !quarter || item.quarter === quarter;
    const matchesSubject = !subject || item.subject === subject;
    return matchesSearch && matchesQuarter && matchesSubject;
  });


  const handleLoginChange = (e) => { const { name, value } = e.target; setLoginForm((c) => ({ ...c, [name]: value })); };
  const handleTutorChange = (e) => { const { name, value } = e.target; setTutorForm((c) => ({ ...c, [name]: value })); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    setDashboardError("");
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: { username: loginForm.username.trim(), password: loginForm.password },
      });
      if (!response?.accessToken || !response?.user) throw new Error("Invalid username or password");
      localStorage.setItem("danilo.token", response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      setDashboard(createBootstrapDashboard(response.user));
      navigate("/overview");
      loadRoleData(response.accessToken, response.user).catch((error) => {
        if (error?.status === 401) {
          localStorage.removeItem("danilo.token");
          setToken(""); setUser(null); setDashboard(null);
          setLoginError("Your session expired. Please sign in again.");
          return;
        }
        setDashboard(createBootstrapDashboard(response.user));
        setDashboardError(error?.message || "Dashboard data could not be loaded yet.");
      });
    } catch (error) {
      if (error?.status === 401) localStorage.removeItem("danilo.token");
      setToken(""); setUser(null); setDashboard(null);
      setLoginError(error?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm("Sign Out", "Are you sure you want to sign out of DANILO?", () => {
      localStorage.removeItem("danilo.token");
      setToken(""); setUser(null); setDashboard(null); setDashboardError("");
      setAdminUsers([]); setAdminCourses([]); setAdminAssignments([]);
      setTutorMessages([]);
      navigate("/");
    }, { confirmLabel: "Sign Out", variant: "danger" });
  };

  const handleTutorSubmit = async (e) => {
    e.preventDefault();
    if (!token || !tutorForm.question.trim()) return;
    const userMsg = { id: nextMsgId++, role: "user", content: tutorForm.question };
    setTutorMessages((prev) => [...prev, userMsg]);
    setTutorForm((f) => ({ ...f, question: "" }));
    setTutorLoading(true);
    try {
      const response = await apiRequest("/ai/tutor", {
        method: "POST", token,
        body: { question: userMsg.content, module_id: tutorForm.moduleId ? Number(tutorForm.moduleId) : null, response_mode: tutorForm.responseMode || "normal" },
      });
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: response.answer, context: response.context }]);
    } catch (error) {
      setTutorMessages((prev) => [...prev, { id: nextMsgId++, role: "ai", content: error.message, context: {} }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const installApp = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    setPromptEvent(null);
  };


  /* Loading state */
  if (token && sessionLoading && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center animate-fade-in shadow-lg">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Opening DANILO</p>
          <p className="text-xs text-slate-400 mt-1">Restoring your session...</p>
        </div>
      </div>
    );
  }

  /* Dashboard error fallback */
  if (token && dashboardError && (!user || !dashboard)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="dn-card p-8 w-full max-w-xs text-center animate-fade-in border-warm-200 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900">Unable to load dashboard</p>
          <p className="text-xs text-warm-600 mt-1.5 leading-relaxed">{dashboardError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 dn-btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  /* Login screen */
  if (!token || !dashboard || !user) {
    return (
      <LoginView
        form={loginForm}
        onChange={handleLoginChange}
        onSubmit={handleLoginSubmit}
        loading={loading}
        error={loginError}
      />
    );
  }

  /* Authenticated layout */
  const { page } = route;
  const forbidden = page !== "not-found" && !isAllowed(user.role, page);

  function renderPage() {
    if (forbidden) return <ForbiddenView navigate={navigate} />;

    switch (page) {
      case "overview":
        return <HomeView user={user} dashboard={dashboard} onNavigate={navigate} />;
      case "my-classes":
        return <MyClassesView courses={dashboard.courses} navigate={navigate} />;
      case "class-detail":
        return <ClassDetailView classId={route.classId} tab={route.tab} courses={dashboard.courses} dashboard={dashboard} navigate={navigate} token={token} user={user} reloadData={reloadData} />;
      case "grades":
        return <GradesView grades={dashboard.grades} />;
      case "ai-tutor":
        return (
          <TutorView
            token={token}
            modules={dashboard.contentFolders}
            form={tutorForm}
            onChange={handleTutorChange}
            onSubmit={handleTutorSubmit}
            loading={tutorLoading}
            messages={tutorMessages}
          />
        );
      case "users":
        return <AdminUsersView token={token} users={adminUsers} reload={reloadData} />;
      case "classes":
        return <AdminClassesView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "enrollments":
        return <AdminEnrollmentsView token={token} users={adminUsers} courses={adminCourses} reload={reloadData} />;
      case "departments":
        return <DepartmentsView token={token} users={adminUsers} reload={reloadData} />;
      case "assignments":
        return <AdminAssignmentsView assignments={adminAssignments} />;
      case "reports":
        return <ReportsView token={token} dashboard={dashboard} />;
      case "system":
      case "settings":
        return <SystemView token={token} addToast={addToast} dismissToast={dismissToast} />;
      case "announcements":
        return user.role === "admin"
          ? <AdminAnnouncementsView token={token} reload={reloadData} />
          : <TeacherAnnouncementsView token={token} courses={adminCourses} reload={reloadData} />;
      case "not-found":
      default:
        return <NotFoundView navigate={navigate} />;
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} currentPage={page} navigate={navigate} onLogout={handleLogout} dashboard={dashboard} />
      <MobileTopBar user={user} currentPage={page} onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawer open={mobileMenuOpen} user={user} currentPage={page} navigate={navigate} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} dashboard={dashboard} />

      <main className="lg:pl-[260px]">
        <div className="min-h-screen pt-[56px] lg:pt-0 pb-[80px] lg:pb-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 max-w-5xl mx-auto">

          <InstallBanner promptEvent={promptEvent} onInstall={installApp} onDismiss={() => setPromptEvent(null)} />

          {dashboardError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-warm-200">
                <svg className="w-4 h-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Live data unavailable</p>
                <p className="text-xs text-warm-600 mt-0.5">{dashboardError}</p>
              </div>
            </div>
          )}

          {renderPage()}
        </div>
      </main>

      <MobileBottomNav currentPage={page} navigate={navigate} role={user.role} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => { closeConfirm(); confirmState.onConfirm && confirmState.onConfirm(); }}
        onCancel={closeConfirm}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
      />
    </div>
  );
}
EOF
}

# =============================================================================

validate_frontend_files() {
  validate_generated_file "${APP_ROOT}/frontend/package.json" "frontend package.json"
  validate_generated_file "${APP_ROOT}/frontend/index.html" "frontend index.html"
  validate_generated_file "${APP_ROOT}/frontend/vite.config.js" "frontend Vite config"
  validate_generated_file "${APP_ROOT}/frontend/tailwind.config.js" "frontend Tailwind config"
  validate_generated_file "${APP_ROOT}/frontend/postcss.config.js" "frontend PostCSS config"
  validate_generated_file "${APP_ROOT}/frontend/public/manifest.webmanifest" "frontend web manifest"
  validate_generated_file "${APP_ROOT}/frontend/src/App.jsx" "frontend App.jsx"
  validate_generated_file "${APP_ROOT}/frontend/src/main.jsx" "frontend main.jsx"
  validate_generated_file "${APP_ROOT}/frontend/src/index.css" "frontend design system CSS"
  validate_generated_file "${APP_ROOT}/frontend/src/api.js" "frontend API client"
  validate_generated_file "${APP_ROOT}/frontend/src/components/shared.jsx" "frontend shared components"
  validate_generated_file "${APP_ROOT}/frontend/src/components/AdminPages.jsx" "frontend admin pages"
  validate_generated_file "${APP_ROOT}/frontend/src/components/LoginView.jsx" "frontend login view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/InstallBanner.jsx" "frontend install banner"
  validate_generated_file "${APP_ROOT}/frontend/src/components/StreamView.jsx" "frontend stream view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/ContentView.jsx" "frontend content view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/GradesView.jsx" "frontend grades view"
  validate_generated_file "${APP_ROOT}/frontend/src/components/TutorView.jsx" "frontend tutor view"
}

validate_frontend_dist() {
  local index_file="${APP_ROOT}/frontend/dist/index.html"
  local build_marker="${APP_ROOT}/frontend/dist/danilo-build.txt"
  validate_generated_file "${index_file}" "frontend built index.html"
  validate_generated_file "${build_marker}" "frontend build marker"
  if [[ ! -d "${APP_ROOT}/frontend/dist/assets" ]]; then
    echo "Frontend build assets folder is missing: ${APP_ROOT}/frontend/dist/assets"
    return 1
  fi
  if ! find "${APP_ROOT}/frontend/dist/assets" -type f | grep -q .; then
    echo "Frontend build assets folder is empty: ${APP_ROOT}/frontend/dist/assets"
    return 1
  fi

  if grep -q '/src/main.jsx' "${index_file}"; then
    echo "Frontend index.html still points at the Vite dev entrypoint instead of built assets."
    return 1
  fi

  if ! grep -Eq 'src="/assets/[^"]+\.js"' "${index_file}"; then
    echo "Frontend index.html does not reference a built JavaScript bundle in /assets."
    return 1
  fi

  if ! grep -Eq 'href="/assets/[^"]+\.css"' "${index_file}"; then
    echo "Frontend index.html does not reference a built CSS bundle in /assets."
    return 1
  fi

  if ! find "${APP_ROOT}/frontend/dist/assets" -type f -name '*.js' | grep -q .; then
    echo "Frontend build assets folder does not contain a JavaScript bundle."
    return 1
  fi

  if ! find "${APP_ROOT}/frontend/dist/assets" -type f -name '*.css' | grep -q .; then
    echo "Frontend build assets folder does not contain a CSS bundle."
    return 1
  fi

  ok "Validated frontend static build assets"
}

build_frontend_static() {
  require_command npm
  validate_frontend_files
  mkdir -p "${APP_ROOT}/frontend/public"
  printf 'danilo-frontend-build=%s\n' "$(date -u +%Y%m%dT%H%M%SZ)" > "${APP_ROOT}/frontend/public/danilo-build.txt"
  run_step_command "Installing DANILO frontend dependencies" npm --prefix "${APP_ROOT}/frontend" install --no-audit --no-fund
  run_step_command "Building DANILO frontend static assets" npm --prefix "${APP_ROOT}/frontend" run build
  run_step_command "Setting readable permissions for gateway-served frontend assets" chmod -R a+rX "${APP_ROOT}/frontend/dist"
  validate_frontend_dist
}

clear_frontend_build_cache() {
  note "Removing old frontend dist, Vite cache, and previously served gateway assets"
  rm -rf "${APP_ROOT}/frontend/dist"
  rm -rf "${APP_ROOT}/frontend/node_modules/.vite"
  rm -rf "${APP_ROOT}/frontend/.vite"
  rm -rf "${APP_ROOT}/gateway/dist"
  ok "Old frontend build artifacts and local cache were removed"
}
