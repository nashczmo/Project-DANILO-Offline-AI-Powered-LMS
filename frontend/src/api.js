const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || "").replace(/\/$/, "");

function normalizePath(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`;
}

export function apiUrl(path) {
  if (!RAW_API_BASE) return normalizePath(path);
  if (RAW_API_BASE.endsWith("/api")) {
    return `${RAW_API_BASE}${normalizePath(path).replace(/^\/api/, "")}`;
  }
  return `${RAW_API_BASE}${normalizePath(path)}`;
}

function buildHeaders(token, extras = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extras
  };
}

const queryCache = new Map();

export function clearApiCache() {
  queryCache.clear();
}

export async function apiRequest(path, { method = "GET", token, body, signal, noCache = false } = {}) {
  const isGet = method.toUpperCase() === "GET";
  const cacheKey = `${token || ""}:${path}`;

  if (isGet && !noCache && queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 180000) {
      return cached.data;
    }
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || "Request failed";
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  
  if (isGet && !noCache) {
    queryCache.set(cacheKey, { data: payload, timestamp: Date.now() });
  }
  return payload;
}

export async function apiUpload(path, { token, formData } = {}) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || "Upload failed";
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }
  return payload;
}
