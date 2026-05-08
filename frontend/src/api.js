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

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
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
