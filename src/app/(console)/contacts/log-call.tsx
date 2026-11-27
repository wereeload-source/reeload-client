"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogCall() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  async function save(f: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const phone = String(f.get("phone")).replace(/\D/g, "");
    const { data: client } = await supabase.from("clients").select("id").eq("phone", phone).maybeSingle();
    const { error } = await supabase.from("contact_log").insert({
      salesperson_id: user?.id, client_id: client?.id ?? null, client_name: f.get("name"), phone, outcome: f.get("outcome"), note: f.get("note") || null,
    });
    if (error) return alert(error.message);
    setOpen(false);
    router.refresh();
  }
  if (!open) return <button className="btn btn-pri" onClick={() => setOpen(true)}>+ Log call</button>;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <form action={save} className="grid w-full max-w-md gap-3 rounded-2xl border border-line bg-paper p-5">
        <h3 className="text-xl font-semibold">Log a call</h3>
        <label className="label">Client<input className="input" name="name" required /></label>
        <label className="label">Phone<input className="input" name="phone" inputMode="tel" /></label>
        <label className="label">Outcome<select className="input" name="outcome"><option value="spoken">Spoken</option><option value="follow_up">Follow up</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
        <label className="label">Note<input className="input" name="note" /></label>
        <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-pri">Save</button></div>
      </form>
    </div>
  );
}
