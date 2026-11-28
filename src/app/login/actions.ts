"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, TOKEN_COOKIE, messageOf } from "@/lib/session";

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
  const data = (await res.json().catch(() => null)) as { token?: string; expires_at?: string } | null;
  if (!res.ok || !data?.token) {
    return { error: res.status === 429 ? messageOf(data, "Too many tries. Wait a while.") : "Wrong email or password" };
  }
  (await cookies()).set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: data.expires_at ? new Date(data.expires_at) : undefined,
  });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function signOut() {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/login");
}
