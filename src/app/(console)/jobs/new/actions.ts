"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const IST = "+05:30";

export async function createJob(_: unknown, f: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const s = (k: string) => String(f.get(k) ?? "").trim();
  const phone = s("phone").replace(/\D/g, "");
  const amount = Number(s("amount"));
  const advance = Number(s("advance"));
  const confirm = f.get("intent") === "confirm";

  // Repeat clients are matched by phone number.
  let { data: client } = await supabase.from("clients").select("id").eq("phone", phone).maybeSingle();
  if (!client) {
    const ins = await supabase.from("clients").insert({ name: s("client"), phone, whatsapp: s("whatsapp").replace(/\D/g, "") || phone, city: s("city"), created_by: user?.id }).select("id").single();
    if (ins.error) return { error: ins.error.message };
    client = ins.data;
  }

  const { data: job, error } = await supabase.from("jobs").insert({
    client_id: client.id,
    status: "draft",
    city: s("city"),
    address: s("address") || null,
    maps_url: s("maps_url") || null,
    starts_at: s("date") && s("time") ? `${s("date")}T${s("time")}:00${IST}` : null,
    duration_minutes: Math.round(Number(s("hours") || 0) * 60) || null,
    onsite_contact_name: s("onsite_name") || null,
    onsite_contact_phone: s("onsite_phone").replace(/\D/g, "") || null,
    brief: s("brief") || null,
    consent: f.get("consent") === "on",
    created_by: user?.id,
  }).select("id, code").single();
  if (error) return { error: error.message };

  if (amount > 0) {
    const m = await supabase.from("job_money").insert({ job_id: job.id, agreed_amount: amount });
    if (m.error) return { error: m.error.message };
  }
  if (advance > 0) {
    const p = await supabase.from("payments").insert({ job_id: job.id, amount: advance, method: s("method") || "upi", reference: s("reference") || null, is_advance: true, recorded_by: user?.id });
    if (p.error) return { error: p.error.message };
  }
  if (confirm) {
    const c = await supabase.rpc("confirm_job", { p_job: job.id });
    if (c.error) return { error: `${job.code} saved as draft. ${c.error.message}` };
  }
  redirect(`/jobs?s=${confirm ? "confirmed" : "draft"}`);
}
