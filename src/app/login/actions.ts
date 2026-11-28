"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE, cookieOptions, safeNext, type TokenPair } from "@/lib/token";

/** The browser's address, so the API's per-address login limit counts people, not this server. */
async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function signIn(_: unknown, form: FormData) {
  const ip = await clientIp();
  let res: Response;
  try {
    res = await fetch(`${API_URL()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ip ? { "X-Forwarded-For": ip } : {}) },
      body: JSON.stringify({ email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { error: "Cannot reach the server. Try again in a moment." };
  }
  const data = (await res.json().catch(() => null)) as (Partial<TokenPair> & { user?: { role?: Role } }) | null;
  if (!res.ok || !data?.access_token || !data.refresh_token) {
    if (res.status === 429) return { error: "Too many tries. Wait 15 minutes and try again." };
    if (res.status === 400) return { error: "Enter a valid email and password" };
    if (res.status >= 500) return { error: "The server had a problem. Try again in a moment." };
    return { error: "Wrong email or password" };
  }
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, data.access_token, cookieOptions());
  jar.set(REFRESH_COOKIE, data.refresh_token, cookieOptions());
  // Go straight to this person's own home: "/" may still be cached from the previous person's session.
  const next = safeNext(String(form.get("next") ?? ""));
  redirect(next === "/" && data.user?.role ? homeFor(data.user.role) : next);
}

/** Ends the sign-in on the server (the refresh token stops working), then clears the cookies. */
export async function endSession() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    await fetch(`${API_URL()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Sign out from a plain form (no JavaScript needed). */
export async function signOut() {
  await endSession();
  redirect("/login");
}
