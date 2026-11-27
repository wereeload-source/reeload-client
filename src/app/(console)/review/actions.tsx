"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { callFn } from "@/lib/functions";

export function ReviewActions({ jobId, status, isAdmin }: { jobId: string; status: string; isAdmin: boolean }) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canLink = ["paid", "delivered"].includes(status) || (isAdmin && status === "released");

  const release = async () => {
    const { error } = await createClient().rpc("release_job", { p_job: jobId });
    if (error) return setError(error.message);
    router.refresh();
  };
  const makeLink = async () => {
    try {
      const r = await callFn<{ url: string }>("share-links", { action: "create", job_id: jobId });
      setLink(r.url);
      await navigator.clipboard?.writeText(r.url).catch(() => {});
      router.refresh();
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        {status === "uploaded" && <button className="btn btn-pri" onClick={release}>Release work</button>}
        {canLink && <button className="btn" onClick={makeLink}>Create 7-day link</button>}
      </div>
      {link && <span className="max-w-64 truncate text-xs text-ok" title={link}>Copied: {link}</span>}
      {error && <span className="text-xs text-rec">{error}</span>}
    </div>
  );
}
