"use client";

/** An API error with the server's plain message. */
export class ClientApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Calls the API from the browser through this app's own /api/proxy route, which adds the
 * signed-in user's token on the server. Throws a ClientApiError carrying the server's message.
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
    throw new ClientApiError(0, "Connection dropped. Check your internet and try again.");
  }
  if (res.status === 401) {
    // A full page load (not client routing) so the proxy can clear the expired session cookies.
    window.location.href = new URL("/login", window.location.origin).toString();
    throw new ClientApiError(401, "Please sign in again");
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const m = (data as { message?: unknown } | null)?.message;
    throw new ClientApiError(res.status, Array.isArray(m) ? m.join(". ") : typeof m === "string" && m ? m : `Request failed (${res.status})`);
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

export const errorText = (e: unknown): string => (e instanceof Error ? e.message : "Something went wrong. Try again.");
