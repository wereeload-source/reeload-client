"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inr } from "@/lib/format";

export function RecordPayment({ jobId, code, balance }: { jobId: string; code: string; balance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(f: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      job_id: jobId, amount: Number(f.get("amount")), method: f.get("method"), reference: f.get("reference") || null, recorded_by: user?.id,
    });
    if (error) return setError(error.message);
    setOpen(false);
    router.refresh();
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>Record payment</button>;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 text-left" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <form action={save} className="w-full max-w-md rounded-2xl border border-line bg-paper p-5">
        <h3 className="text-xl font-semibold">Record payment</h3>
        <div className="text-sm text-mute">{code} · balance {inr(balance)}</div>
        <div className="my-3.5 grid grid-cols-2 gap-3">
          <label className="label">Amount (₹)<input className="input" name="amount" inputMode="numeric" defaultValue={balance} required /></label>
          <label className="label">Method<select className="input" name="method"><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option></select></label>
          <label className="label col-span-2">Reference<input className="input" name="reference" /></label>
        </div>
        {error && <p className="mb-3 text-[13px] text-rec">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-pri">Save payment</button></div>
      </form>
    </div>
  );
}
