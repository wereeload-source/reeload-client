"use server";
import { revalidatePath } from "next/cache";
import { api, attempt } from "@/lib/session";

export async function createUser(_: unknown, form: FormData) {
  const role = String(form.get("role"));
  const body = {
    full_name: String(form.get("full_name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? "") || null,
    password: String(form.get("password") ?? ""),
    role,
    ...(role === "reelmaker" ? { kind: String(form.get("kind") || "full_time"), base_city: String(form.get("base_city") ?? "") } : {}),
  };
  const r = await attempt(() => api.post("/users", body));
  if (r.error) return { error: r.error };
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setActive(id: string, active: boolean) {
  const r = await attempt(() => api.patch(`/users/${id}`, { active }));
  if (r.error) return { error: r.error };
  revalidatePath("/users");
  return {};
}
