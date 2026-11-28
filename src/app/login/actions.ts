"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { messageOf } from "@/lib/session";
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE, cookieOptions, type TokenPair } from "@/lib/token";

export async function signIn(_: unknown, form: FormData) {
  let res: Response;
  try {
    res = await fetch(`${API_URL()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") }),
      cache: "no-store",
    });
  } catch {
    return { error: "Cannot reach the server. Try again in a moment." };
  }
  const data = (await res.json().catch(() => null)) as Partial<TokenPair> | null;
  if (!res.ok || !data?.access_token || !data.refresh_token) {
    return { error: res.status === 429 ? messageOf(data, "Too many tries. Wait a while.") : "Wrong email or password" };
  }
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, data.access_token, cookieOptions());
  jar.set(REFRESH_COOKIE, data.refresh_token, cookieOptions());
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

/** Ends the sign-in on the server (the refresh token stops working), then clears the cookies. */
export async function signOut() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    await fetch(`${API_URL()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect("/login");
}
