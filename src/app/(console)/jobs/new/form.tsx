"use client";
import { useActionState, useState } from "react";
import { createJob } from "./actions";

const CITIES = ["Mumbai", "Pune", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Goa"];

export function NewJobForm() {
  const [state, action, pending] = useActionState(createJob, null);
  const [advance, setAdvance] = useState("");
  const [consent, setConsent] = useState(false);
  return (
    <form action={action} className="card grid max-w-3xl gap-3 p-5">
      <p className="text-sm text-mute">A job stays a draft until the advance is recorded.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">Client name<input className="input" name="client" required /></label>
        <label className="label">Phone<input className="input" name="phone" inputMode="tel" required /></label>
        <label className="label">WhatsApp<input className="input" name="whatsapp" inputMode="tel" placeholder="Same as phone if empty" /></label>
        <label className="label">City<select className="input" name="city">{CITIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="label sm:col-span-2">Address<input className="input" name="address" /></label>
        <label className="label sm:col-span-2">Google Maps link<input className="input" name="maps_url" type="url" /></label>
        <label className="label">Date<input className="input" name="date" type="date" /></label>
        <label className="label">Start time<input className="input" name="time" type="time" /></label>
        <label className="label">Duration (hours)<input className="input" name="hours" type="number" step="0.5" min="0.5" defaultValue="2" /></label>
        <span />
        <label className="label">On-site contact<input className="input" name="onsite_name" /></label>
        <label className="label">On-site WhatsApp (gets the check-in code)<input className="input" name="onsite_phone" inputMode="tel" /></label>
        <label className="label sm:col-span-2">What to shoot<textarea className="input" name="brief" rows={2} /></label>
        <label className="label">Agreed amount (₹)<input className="input" name="amount" inputMode="numeric" required /></label>
        <label className="label">Advance received (₹)<input className="input" name="advance" inputMode="numeric" placeholder="Required to confirm" value={advance} onChange={(e) => setAdvance(e.target.value)} /></label>
        <label className="label">Advance method<select className="input" name="method"><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option></select></label>
        <label className="label">Reference<input className="input" name="reference" /></label>
        <label className="flex items-center gap-2 font-medium sm:col-span-2">
          <input type="checkbox" name="consent" className="h-[18px] w-[18px] accent-rec" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Client consents to footage and location being recorded
        </label>
      </div>
      {state?.error && <p className="rounded-lg bg-recs p-2.5 text-[13px] text-rec">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button className="btn" name="intent" value="draft" disabled={pending}>Save as draft</button>
        <button className="btn btn-pri" name="intent" value="confirm" disabled={pending || !(Number(advance) > 0 && consent)}>Confirm job</button>
      </div>
    </form>
  );
}
