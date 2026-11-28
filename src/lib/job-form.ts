import { istInstant } from "@/lib/format";

const METHODS = ["upi", "bank_transfer", "cash"] as const;

/** Turns the form into the API's single "create job" call. The API saves everything or nothing. */
export function buildJob(f: FormData) {
  const s = (k: string) => String(f.get(k) ?? "").trim();
  const n = (k: string) => {
    const v = Number(s(k).replace(/[,₹\s]/g, ""));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const method = s("method") as (typeof METHODS)[number];
  const advance = n("advance");
  const hours = n("hours");
  return {
    client: { name: s("client"), phone: s("phone"), whatsapp: s("whatsapp") || undefined, city: s("city") || undefined },
    job: {
      city: s("city"),
      address: s("address") || null,
      maps_url: s("maps_url") || null,
      starts_at: istInstant(s("date"), s("time")),
      duration_minutes: hours ? Math.round(hours * 60) : null,
      onsite_contact_name: s("onsite_name") || null,
      onsite_contact_phone: s("onsite_phone") || null,
      brief: s("brief") || null,
      consent: f.get("consent") === "on",
    },
    agreed_amount: n("amount"),
    advance: advance ? { amount: advance, method: METHODS.includes(method) ? method : "upi", reference: s("reference") || null } : undefined,
    confirm: f.get("intent") === "confirm",
  };
}
