"use client";

/**
 * Calls the API from the browser through this app's own /api/proxy route, which adds the
 * signed-in user's token on the server. Throws an Error carrying the server's plain message.
 */
export async function call<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/proxy${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Connection dropped");
  }
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Please sign in again");
  }
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const m = (data as { message?: unknown } | null)?.message;
    throw new Error(Array.isArray(m) ? m.join(". ") : typeof m === "string" && m ? m : `Request failed (${res.status})`);
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => call<T>("GET", path),
  post: <T>(path: string, body: unknown = {}) => call<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => call<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => call<T>("PATCH", path, body),
  del: <T>(path: string) => call<T>("DELETE", path),
};
