/**
 * Sign-in tokens live in httpOnly cookies, so page scripts can never read them.
 * Safe to import from the proxy (no next/headers here).
 */
export const ACCESS_COOKIE = "reeload_access";
export const REFRESH_COOKIE = "reeload_refresh";

export const API_URL = () => (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** What POST /auth/login and /auth/refresh answer with (the API uses snake_case). */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** The refresh cookie lasts as long as the API's refresh token (REFRESH_TOKEN_TTL, 14 days by default). */
const REFRESH_DAYS = Number(process.env.REFRESH_COOKIE_DAYS ?? 14);

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_DAYS * 86_400,
  };
}

/** When the access token expires (ms since 1970), or 0 if it is not a readable token. The API still checks the signature. */
export function accessExpiry(token: string | undefined): number {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** True when the access token is missing, expired or about to expire. */
export const needsRefresh = (token: string | undefined, marginMs = 30_000): boolean => accessExpiry(token) - marginMs < Date.now();

// A refresh token works once, so two requests refreshing at the same moment would make the second
// one fail and end the whole sign-in. Requests that arrive together share one refresh call.
const inFlight = new Map<string, Promise<TokenPair | null>>();

export function refreshSession(refreshToken: string): Promise<TokenPair | null> {
  const running = inFlight.get(refreshToken);
  if (running) return running;
  const call = (async () => {
    try {
      const res = await fetch(`${API_URL()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      return res.ok ? ((await res.json()) as TokenPair) : null;
    } catch {
      return null;
    }
  })().finally(() => setTimeout(() => inFlight.delete(refreshToken), 10_000));
  inFlight.set(refreshToken, call);
  return call;
}

/**
 * Where to go after signing in. Only same-site paths are allowed, so a crafted
 * `/login?next=https://evil.example` link cannot bounce someone to another site.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || /[\r\n\t]/.test(next)) return "/";
  return next.startsWith("/login") ? "/" : next;
}
