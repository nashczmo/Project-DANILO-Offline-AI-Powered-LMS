const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || "").replace(/\/$/, "");

function normalizePath(path) {
  const rawPath = String(path || "/");
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const [pathname, suffix = ""] = rawPath.split(/([?#].*)/, 2);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const apiPath = normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`;
  return `${apiPath}${suffix}`;
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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extras
  };
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

export async function apiRequest(path, { method = "GET", token, body, signal, headers } = {}) {
  const hasBody = body !== undefined && body !== null;
  const response = await fetch(apiUrl(path), {
    method,
    headers: buildHeaders(token, hasBody ? { "Content-Type": "application/json", ...headers } : headers),
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });
  const payload = await parseResponse(response);
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
  const payload = await parseResponse(response);
  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || "Upload failed";
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }
  return payload;
}
