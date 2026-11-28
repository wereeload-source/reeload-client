"use client";
import { useActionState, useRef, useState } from "react";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { createUser } from "./actions";

export function NewUser() {
  const form = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<Role>("sales");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: unknown, data: FormData) => {
    const r = await createUser(prev, data);
    if (r.ok) { form.current?.reset(); setOpen(false); }
    return r;
  }, null as { error?: string; ok?: true } | null);

  if (!open) return <button className="btn btn-pri" onClick={() => setOpen(true)}>New user</button>;
  return (
    <form ref={form} action={action} className="card grid max-w-xl gap-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="label">Full name<input className="input" name="full_name" required /></label>
        <label className="label">Phone<input className="input" name="phone" inputMode="tel" /></label>
        <label className="label">Email<input className="input" name="email" type="email" required /></label>
        <label className="label">Temporary password<input className="input" name="password" type="text" minLength={8} required autoComplete="off" /></label>
        <label className="label">Role
          <select className="input" name="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        {role === "reelmaker" && (
          <>
            <label className="label">Type
              <select className="input" name="kind"><option value="full_time">Full time</option><option value="freelance">Freelance</option></select>
            </label>
            <label className="label">Base city<input className="input" name="base_city" required /></label>
          </>
        )}
      </div>
      {state?.error && <p className="text-[13px] text-rec">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn btn-pri" disabled={pending}>{pending ? "Creating…" : "Create user"}</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
