"use client";
import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="label">Email<input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="label">Password<input className="input" name="password" type="password" autoComplete="current-password" required /></label>
      {state?.error && <p className="text-[13px] text-rec">{state.error}</p>}
      <button className="btn btn-pri justify-center" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
