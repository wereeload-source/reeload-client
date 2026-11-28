import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canOpen, type NavKey } from "@/lib/nav";
import { ACCESS_COOKIE, API_URL } from "@/lib/token";
import type { Profile } from "@/lib/types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The API answers { statusCode, message } where message is text or a list of texts. */
export function messageOf(body: unknown, fallback: string): string {
  const m = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return m.join(". ");
  return typeof m === "string" && m ? m : fallback;
}

function parse(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  let res: Response;
  try {
    res = await fetch(`${API_URL()}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(503, "Cannot reach the server. Try again in a moment.");
  }
  // The proxy renews tokens before pages run, so a 401 here means the sign-in is over (expired, signed out or disabled).
  if (res.status === 401 && token) redirect("/login");
  const data = parse(await res.text());
  if (!res.ok) throw new ApiError(res.status, messageOf(data, `Request failed (${res.status})`));
  return data as T;
}

/** Server-side API calls (pages and server actions). They carry the signed-in user's token. */
export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown = {}) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** For server actions: run a call and hand back `{ error }` instead of throwing. */
export async function attempt<T>(fn: () => Promise<T>): Promise<{ data: T; error?: undefined } | { error: string; data?: undefined }> {
  try {
    return { data: await fn() };
  } catch (e) {
    // Anything that is not an API error (like redirect()) must keep travelling.
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

/** The signed-in user's profile, or a redirect to /login. Disabled users are sent away too. */
export async function requireProfile(): Promise<{ me: Profile }> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");
  try {
    return { me: await api.get<Profile>("/me") };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 404)) redirect("/login?disabled=1");
    throw e;
  }
}

/** Like requireProfile, but also sends people away from console pages their role does not use. */
export async function requirePage(key: NavKey): Promise<{ me: Profile }> {
  const { me } = await requireProfile();
  if (!canOpen(me.role, key)) redirect("/");
  return { me };
}
