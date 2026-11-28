import { buildJob } from "./job-form";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("new job form -> API request", () => {
  it("builds a confirmed job with advance, IST start time and minutes", () => {
    const body = buildJob(form({
      client: " Asha Films ", phone: "+91 98765 43210", city: "Hyderabad", date: "2026-12-03", time: "10:00",
      hours: "2.5", amount: "15,000", advance: "₹5000", method: "cash", consent: "on", intent: "confirm",
    }));
    expect(body.client).toEqual({ name: "Asha Films", phone: "+91 98765 43210", whatsapp: undefined, city: "Hyderabad" });
    expect(body.job.starts_at).toBe("2026-12-03T10:00:00+05:30");
    expect(body.job.duration_minutes).toBe(150);
    expect(body.job.consent).toBe(true);
    expect(body.agreed_amount).toBe(15000);
    expect(body.advance).toEqual({ amount: 5000, method: "cash", reference: null });
    expect(body.confirm).toBe(true);
  });
  it("leaves out an advance of zero, junk numbers and unknown payment methods", () => {
    const body = buildJob(form({ client: "A", phone: "1234567", city: "Goa", amount: "abc", advance: "0", method: "bitcoin", intent: "draft" }));
    expect(body.agreed_amount).toBeUndefined();
    expect(body.advance).toBeUndefined();
    expect(body.job.starts_at).toBeNull();
    expect(body.confirm).toBe(false);
    expect(buildJob(form({ advance: "10", method: "bitcoin" })).advance?.method).toBe("upi");
  });
});
