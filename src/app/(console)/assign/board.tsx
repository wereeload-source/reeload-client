"use client";
import { Alert, Button, Spinner, toast } from "@heroui/react";
import { AlertTriangle, CalendarPlus, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Chip, Empty } from "@/components/ui";
import { apiClient, errorText } from "@/lib/api-client";
import { day, hours, time } from "@/lib/format";
import type { Candidate, QueueJob } from "@/lib/types";

const AVAIL = { free: { label: "Free", tone: "ok" }, busy: { label: "Booked", tone: "rec" }, leave: { label: "On leave", tone: undefined } } as const;

export function AssignBoard({ jobs }: { jobs: QueueJob[] }) {
  const router = useRouter();
  const [pick, setPick] = useState<string | undefined>(jobs[0]?.id);
  // Candidates are kept per job, so switching jobs shows a spinner until that job's list arrives.
  const [loaded, setLoaded] = useState<{ job: string; list: Candidate[] } | null>(null);

  const [rm, setRm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // After an assignment the job leaves the list: move on to the next one instead of showing nothing.
  const job = jobs.find((j) => j.id === pick) ?? jobs[0];
  const jobId = job?.id;
  const candidates = loaded && loaded.job === jobId ? loaded.list : null;

  useEffect(() => {
    if (!jobId) return;
    let live = true;
    apiClient
      .get<Candidate[]>(`/jobs/${encodeURIComponent(jobId)}/candidates`)
      .then((c) => live && (setLoaded({ job: jobId, list: c }), setError(null)))
      .catch((e) => live && (setLoaded({ job: jobId, list: [] }), setError(errorText(e))));
    return () => { live = false; };
  }, [jobId]);

  function choose(id: string) {
    setPick(id);
    setRm(null);
    setError(null);
  }

  async function assign() {
    if (!job || !rm) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(`/jobs/${encodeURIComponent(job.id)}/assign`, { reelmaker_id: rm });
      toast.success(`${job.code} assigned. The reelmaker has been asked.`);
      router.refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="card px-2 py-1.5">
        {jobs.length ? (
          <table className="tbl">
            <thead><tr><th>Job</th><th>Client</th><th>When</th><th>Note</th></tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  tabIndex={0}
                  aria-selected={j.id === jobId}
                  onClick={() => choose(j.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choose(j.id))}
                  className={`cursor-pointer hover:bg-sub focus-visible:outline-2 focus-visible:outline-rec ${j.id === jobId ? "bg-sub outline-2 -outline-offset-2 outline-rec" : ""}`}
                >
                  <td className="text-mute">{j.code}</td>
                  <td><b>{j.client_name}</b><div className="text-[13px] text-mute">{j.city} · {hours(j.duration_minutes)} shoot</div></td>
                  <td className="whitespace-nowrap">{j.starts_at ? `${day(j.starts_at)} · ${time(j.starts_at)}` : "—"}</td>
                  <td>
                    {j.flagged && <span className="flex items-center gap-1 text-[13px] font-semibold text-rec"><AlertTriangle aria-hidden className="size-3.5" />Starts soon</span>}
                    {j.last_release && <div className="text-[12.5px] text-mute">{j.last_release.reelmaker} {j.last_release.status}{j.last_release.reason ? `: ${j.last_release.reason}` : ""}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon={UserRoundCheck}>Every confirmed job has a reelmaker.</Empty>}
      </div>

      <div className="card">
        {job ? (
          <>
            <h3>{job.client_name}</h3>
            <div className="text-sm text-mute">{job.code} · {day(job.starts_at)}, {time(job.starts_at)} for {hours(job.duration_minutes)} · {job.city}</div>
            {job.brief && <p className="my-2.5 text-sm">{job.brief}</p>}
            <div className="mt-2 text-sm font-semibold">Reelmakers</div>
            {candidates === null ? (
              <div className="grid place-items-center p-6"><Spinner aria-label="Loading reelmakers" /></div>
            ) : candidates.length === 0 && !error ? (
              <Empty>No active reelmakers.</Empty>
            ) : (
              <div role="radiogroup" aria-label="Choose a reelmaker">
                {candidates.map((c) => {
                  const off = c.availability !== "free";
                  const a = AVAIL[c.availability];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={rm === c.id}
                      disabled={off}
                      onClick={() => setRm(c.id)}
                      className={`mt-2 flex w-full items-center gap-2.5 rounded-xl border bg-paper p-2.5 text-left ${rm === c.id ? "border-rec shadow-[0_0_0_2px_var(--recs)]" : "border-line"} ${off ? "cursor-not-allowed opacity-55" : ""}`}
                    >
                      <Avatar name={c.full_name} />
                      <span className="flex-1">
                        <b>{c.full_name}</b><br />
                        <span className="text-[13px] text-mute">{c.base_city}{c.same_city ? " · same city" : ""} · {c.shoots_next7_days} shoots this week</span>
                      </span>
                      <Chip tone={a.tone}>{a.label}</Chip>
                    </button>
                  );
                })}
              </div>
            )}
            {error && (
              <Alert status="danger" className="mt-3">
                <Alert.Indicator />
                <Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content>
              </Alert>
            )}
            <Button className="mt-3" fullWidth isDisabled={!rm} isPending={busy} onPress={assign}>
              <CalendarPlus aria-hidden className="size-4" /> Assign and block calendar
            </Button>
          </>
        ) : <div className="text-mute">Pick a job on the left.</div>}
      </div>
    </div>
  );
}
