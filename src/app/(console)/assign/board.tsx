"use client";
import { Alert, Button, Card, Link, Radio, RadioGroup, Spinner, toast } from "@heroui/react";
import { UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chip, Empty, Facts } from "@/components/ui";
import { apiClient, errorText } from "@/lib/api-client";
import { dayTime, hours, startsIn, window_ } from "@/lib/format";
import type { Candidate, QueueJob } from "@/lib/types";

const STATE = {
  free: { label: "Free", text: "text-ok" },
  busy: { label: "Not available", text: "text-bad" },
  leave: { label: "Not available", text: "text-bad" },
} as const;

const pickCard =
  "flex w-full flex-col items-stretch gap-1.5 text-left rounded-[10px] border-2 border-line bg-paper p-3.5 transition-colors data-[selected=true]:border-rec data-[selected=true]:bg-recs data-[focus-visible=true]:border-rec data-[disabled=true]:bg-sub data-[disabled=true]:opacity-70";

const note = (c: Candidate) =>
  c.availability === "leave"
    ? "On leave at this time."
    : c.availability === "busy"
      ? "Overlaps a booking at this time."
      : `${c.base_city}${c.same_city ? ", same city" : ""}. ${c.shoots_next7_days} ${c.shoots_next7_days === 1 ? "shoot" : "shoots"} this week.`;

/** Operations: pick an unassigned job on the left, a free reelmaker on the right, assign (the mockup's flow). */
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
  const chosen = candidates?.find((c) => c.id === rm) ?? null;

  useEffect(() => {
    if (!jobId) return;
    let live = true;
    apiClient
      .get<Candidate[]>(`/jobs/${encodeURIComponent(jobId)}/candidates`)
      .then((c) => live && (setLoaded({ job: jobId, list: c }), setError(null)))
      .catch((e) => live && (setLoaded({ job: jobId, list: [] }), setError(errorText(e))));
    return () => {
      live = false;
    };
  }, [jobId]);

  function choose(id: string) {
    setPick(id);
    setRm(null);
    setError(null);
  }

  async function assign() {
    if (!job || !chosen) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(`/jobs/${encodeURIComponent(job.id)}/assign`, { reelmaker_id: chosen.id });
      toast.success(`Assigned to ${chosen.full_name}. Their calendar is blocked and they have been asked to accept.`);
      setRm(null);
      router.refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!jobs.length) {
    return (
      <Card className="p-6">
        <Empty icon={UserRoundCheck}>Every confirmed job has a reelmaker.</Empty>
      </Card>
    );
  }

  const hot = (job?.hours_to_start ?? Infinity) < 48;
  const message = chosen
    ? { text: `No conflict found for ${chosen.full_name}. The slot will be blocked when you assign.`, tone: "text-ok" }
    : { text: "Pick a reelmaker. Unavailable people are greyed out so a double booking cannot happen.", tone: "text-mute2" };

  return (
    <div className="flex flex-wrap items-start gap-5">
      <Card className="max-w-[420px] min-w-[280px] flex-[1_1_320px] p-3">
        <RadioGroup aria-label="Unassigned jobs" value={jobId ?? null} onChange={choose} className="gap-2">
          {jobs.map((j) => {
            const soon = (j.hours_to_start ?? Infinity) < 48;
            return (
              <Radio key={j.id} value={j.id} className="w-full">
                <Radio.Content className={pickCard}>
                  <span className="flex items-center justify-between gap-2.5">
                    <span className="text-[15px] font-semibold text-ink">{j.client_name}</span>
                    <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium whitespace-nowrap ${soon ? "bg-bads text-bad" : "bg-neutrals text-neutral"}`}>
                      {startsIn(j.hours_to_start)}
                    </span>
                  </span>
                  <span className="text-[13px] text-mute2">{dayTime(j.starts_at)} · {j.city}</span>
                  {j.last_release && (
                    <span className="text-xs text-warn">
                      {j.last_release.reelmaker} {j.last_release.status}{j.last_release.reason ? `: ${j.last_release.reason}` : ""}
                    </span>
                  )}
                </Radio.Content>
              </Radio>
            );
          })}
        </RadioGroup>
      </Card>

      {job && (
        <section aria-label="Job detail" className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
          <Card className="gap-3.5 px-6 py-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-[22px] font-semibold">{job.client_name}</h2>
              <Chip tone={hot ? "bad" : "neutral"}>{hot ? "Inside 48 hours" : "Unassigned"}</Chip>
            </div>
            <Facts
              items={[
                { label: "When", value: `${dayTime(job.starts_at)} (${window_(job.starts_at, job.duration_minutes)}, ${hours(job.duration_minutes)})` },
                {
                  label: "Where",
                  value: (
                    <>
                      {job.address ?? job.city}
                      {job.maps_url && (
                        <>
                          {" · "}
                          <Link href={job.maps_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-info">Open map</Link>
                        </>
                      )}
                    </>
                  ),
                },
                { label: "On-site contact", value: [job.onsite_contact_name, job.onsite_contact_phone].filter(Boolean).join(", ") || "Not given" },
              ]}
            />
            {job.brief && (
              <div className="rounded-[10px] bg-sub px-3.5 py-3 text-sm leading-normal">
                <strong>Brief.</strong> {job.brief}
              </div>
            )}
          </Card>

          <Card className="gap-3 px-6 py-[22px]">
            <h3 className="m-0 text-lg font-semibold">Reelmakers for this slot</h3>
            {candidates === null ? (
              <div className="grid place-items-center p-6"><Spinner aria-label="Loading reelmakers" /></div>
            ) : candidates.length === 0 && !error ? (
              <Empty>No active reelmakers.</Empty>
            ) : (
              <RadioGroup aria-label="Choose a reelmaker" value={rm} onChange={setRm} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
                {candidates.map((c) => (
                  <Radio key={c.id} value={c.id} isDisabled={c.availability !== "free"} className="w-full">
                    <Radio.Content className={pickCard}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-ink">
                          {c.full_name} <span className="text-xs font-normal text-mute">· {c.kind === "full_time" ? "Full-time" : "Freelance"}</span>
                        </span>
                        <span className={`text-xs font-semibold ${STATE[c.availability].text}`}>{STATE[c.availability].label}</span>
                      </span>
                      <span className="text-[13px] leading-snug text-mute2">{note(c)}</span>
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            )}
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content>
              </Alert>
            )}
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
              <div role="status" className={`flex-[1_1_280px] text-[13px] font-medium ${message.tone}`}>{message.text}</div>
              <Button size="lg" isDisabled={!chosen} isPending={busy} onPress={assign}>
                {chosen ? `Assign ${chosen.full_name}` : "Assign"}
              </Button>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
