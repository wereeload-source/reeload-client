"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Respond({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const answer = async (accept: boolean) => {
    const reason = accept ? null : prompt("Reason for declining?") ?? "";
    setBusy(true);
    const { error } = await createClient().rpc("respond_assignment", { p_assignment: assignmentId, p_accept: accept, p_reason: reason });
    setBusy(false);
    if (error) alert(error.message);
    router.refresh();
  };
  return (
    <div className="flex gap-2.5">
      <button className="mbtn mbtn-ghost min-h-11 p-2.5" disabled={busy} onClick={() => answer(false)}>Decline</button>
      <button className="mbtn min-h-11 p-2.5" disabled={busy} onClick={() => answer(true)}>Accept</button>
    </div>
  );
}
