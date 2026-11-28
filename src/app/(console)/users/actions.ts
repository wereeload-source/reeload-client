"use server";
import { revalidatePath } from "next/cache";
import { api, attempt } from "@/lib/session";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createUser(_: unknown, form: FormData) {
  const role = text(form, "role");
  const body = {
    full_name: text(form, "full_name"),
    email: text(form, "email"),
    phone: text(form, "phone") || null,
    // Passwords are sent as typed (no trimming) and hashed by the API; they are never stored here.
    password: String(form.get("password") ?? ""),
    role,
    ...(role === "reelmaker" ? { kind: text(form, "kind") || "full_time", base_city: text(form, "base_city") } : {}),
  };
  const r = await attempt(() => api.post("/users", body));
  if (r.error) return { error: r.error };
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setActive(id: string, active: boolean) {
  const r = await attempt(() => api.patch(`/users/${encodeURIComponent(id)}`, { active }));
  if (r.error) return { error: r.error };
  revalidatePath("/users");
  return {};
}

export async function resetPassword(id: string, password: string) {
  const r = await attempt(() => api.post(`/users/${encodeURIComponent(id)}/password`, { password }));
  if (r.error) return { error: r.error };
  return {};
}
