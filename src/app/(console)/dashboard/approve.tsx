"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ApprovePriceChange({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const decide = async (approve: boolean) => {
    setBusy(true);
    const { error } = await createClient().rpc("decide_price_change", { p_change: id, p_approve: approve });
    setBusy(false);
    if (error) alert(error.message);
    router.refresh();
  };
  return (
    <div className="flex gap-1.5">
      <button className="btn" disabled={busy} onClick={() => decide(false)}>Reject</button>
      <button className="btn btn-pri" disabled={busy} onClick={() => decide(true)}>Approve</button>
    </div>
  );
}
