"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Chip, Empty } from "@/components/ui";
import { day, hoursSince, time } from "@/lib/format";
import type { Job } from "@/lib/types";

type Range = { reelmaker_id: string; time_range: string };

/** Parses a Postgres tstzrange like ["2026-11-27 10:00:00+00","2026-11-27 13:00:00+00"). */
function parseRange(r: string): [number, number] {
  const [a, b] = r.slice(1, -1).split(",").map((s) => s.replace(/"/g, "").trim());
  return [a ? Date.parse(a.replace(" ", "T")) : -Infinity, b ? Date.parse(b.replace(" ", "T")) : Infinity];
}
const overlaps = (ranges: Range[], id: string, from: number, to: number) =>
  ranges.some((r) => r.reelmaker_id === id && (([a, b]) => a < to && from < b)(parseRange(r.time_range)));

export function AssignBoard({ jobs, reelmakers, booked, leave }: {
  jobs: Job[]; reelmakers: { id: string; name: string; kind: string }[]; booked: Range[]; leave: Range[];
}) {
  const router = useRouter();
  const [pick, setPick] = useState(jobs[0]?.id);
  const [rm, setRm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = jobs.find((j) => j.id === pick);
  const from = job?.starts_at ? Date.parse(job.starts_at) : 0;
  const to = from + (job?.duration_minutes ?? 0) * 60_000;

  async function assign() {
    if (!job || !rm) return;
    setBusy(true); setError(null);
    const { error } = await createClient().rpc("assign_job", { p_job: job.id, p_reelmaker: rm });
    setBusy(false);
    if (error) return setError(error.message);
    setRm(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="card px-2 py-1.5">
        {jobs.length ? (
          <table className="tbl">
            <thead><tr><th>Job</th><th>Client</th><th>When</th><th>Waiting</th></tr></thead>
            <tbody>
              {jobs.map((j) => {
                const h = hoursSince(j.confirmed_at);
                return (
                  <tr key={j.id} onClick={() => { setPick(j.id); setRm(null); }} className={`cursor-pointer hover:bg-sub ${j.id === pick ? "outline-2 -outline-offset-2 outline-rec" : ""}`}>
                    <td className="text-mute">{j.code}</td>
                    <td><b>{j.clients?.name}</b><div className="text-[13px] text-mute">{j.city} · {(j.duration_minutes ?? 0) / 60}h shoot</div></td>
                    <td className="whitespace-nowrap">{day(j.starts_at)} · {time(j.starts_at)}</td>
                    <td>{h > 48 ? <span className="text-[13px] font-semibold text-rec">⚠ {h}h</span> : <span className="text-mute">{h}h</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty>Every confirmed job has a reelmaker.</Empty>}
      </div>
      <div className="card">
        {job ? (
          <>
            <h3>{job.clients?.name}</h3>
            <div className="text-sm text-mute">{job.code} · {day(job.starts_at)}, {time(job.starts_at)} for {(job.duration_minutes ?? 0) / 60}h · {job.city}</div>
            <p className="my-2.5 text-sm">{job.brief}</p>
            <div className="mt-1.5 text-sm font-semibold">Available reelmakers</div>
            {reelmakers.map((r) => {
                const onLeave = overlaps(leave, r.id, from, to);
                const busyAt = overlaps(booked, r.id, from, to);
                const dis = onLeave || busyAt;
                return (
                  <button key={r.id} disabled={dis} onClick={() => setRm(r.id)}
                    className={`mt-2 flex w-full items-center gap-2.5 rounded-xl border bg-paper p-2.5 text-left ${rm === r.id ? "border-rec shadow-[0_0_0_2px_var(--recs)]" : "border-line"} ${dis ? "cursor-not-allowed opacity-55" : ""}`}>
                    <Avatar name={r.name} />
                    <span className="flex-1"><b>{r.name}</b><br /><span className="text-[13px] capitalize text-mute">{r.kind.replace("_", "-")}</span></span>
                    {onLeave ? <Chip>On leave</Chip> : busyAt ? <Chip tone="rec">Overlaps</Chip> : <Chip tone="ok">Free</Chip>}
                  </button>
                );
              })}
            {error && <p className="mt-3 rounded-lg bg-recs p-2.5 text-[13px] text-rec">{error}</p>}
            <button className="btn btn-pri mt-3 w-full justify-center" disabled={!rm || busy} onClick={assign}>Assign and block calendar</button>
          </>
        ) : <div className="text-mute">Pick a job on the left.</div>}
      </div>
    </div>
  );
}
