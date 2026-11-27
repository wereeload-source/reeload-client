import { API_URL } from "@/lib/env";

/** Error from the NestJS API, with the HTTP status and the server's message. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiInit = Omit<RequestInit, "body"> & {
  /** Sent as JSON with a matching content-type. */
  json?: unknown;
  body?: BodyInit;
  /** Supabase access token, sent as `Authorization: Bearer <token>`. */
  token?: string;
};

/**
 * Calls the NestJS API in reeload-server/api (NEXT_PUBLIC_API_URL, default http://localhost:4000).
 * Works in server and client components. Returns parsed JSON, or text for non-JSON responses.
 *
 *   const health = await api<string>("/");
 *   await api("/jobs", { method: "POST", json: { name }, token: session.access_token });
 */
export async function api<T = unknown>(path: string, { json, token, headers, ...init }: ApiInit = {}): Promise<T> {
  const h = new Headers(headers);
  if (json !== undefined) h.set("content-type", "application/json");
  if (token) h.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data: unknown = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();

  if (!res.ok) {
    // Nest errors look like { statusCode, message, error }; message can be a list from validation.
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? [(data as { message: unknown }).message].flat().join(", ")
        : typeof data === "string" && data
          ? data
          : res.statusText;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}
