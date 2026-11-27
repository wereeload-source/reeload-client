import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/supabase/server";
import { day, time } from "@/lib/format";
import { ShootFlow } from "./flow";

export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, me } = await requireProfile();
  const [{ data: job }, { data: checkin }, { data: uploads }] = await Promise.all([
    supabase.from("jobs").select("*, clients(name)").eq("id", id).single(),
    supabase.from("checkins").select("verified_at, completed_at, method").eq("job_id", id).eq("reelmaker_id", me.id).maybeSingle(),
    supabase.from("uploads").select("id, kind, file_name, size_bytes, status").eq("job_id", id).neq("kind", "proof").order("created_at"),
  ]);
  if (!job) notFound();
  const end = job.starts_at ? new Date(new Date(job.starts_at).getTime() + job.duration_minutes * 60_000).toISOString() : null;

  return (
    <>
      <div className="flex items-center gap-2.5 py-2">
        <Link href="/m" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-sub">‹</Link>
        <h2 className="font-display text-xl font-bold tracking-tight">{job.clients?.name}</h2>
      </div>
      <div className="mcard">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-sm">
          <dt className="text-mute">When</dt><dd className="font-medium">{day(job.starts_at)}, {time(job.starts_at)} – {time(end)}</dd>
          <dt className="text-mute">Where</dt><dd className="font-medium">{job.address ?? job.city}</dd>
          {job.onsite_contact_name && <><dt className="text-mute">On site</dt><dd className="font-medium">{job.onsite_contact_name} · {job.onsite_contact_phone}</dd></>}
          <dt className="text-mute">Job</dt><dd className="font-medium">{job.code}</dd>
        </dl>
        {(job.maps_url || job.address) && (
          <a href={job.maps_url ?? `https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener" className="mbtn mbtn-ghost mt-3 min-h-11">Open in Google Maps</a>
        )}
      </div>
      <div className="mcard"><b>Brief</b><p className="mt-1.5 text-sm">{job.brief}</p></div>
      <ShootFlow
        jobId={job.id}
        stage={checkin?.completed_at ? "upload" : checkin?.verified_at ? "photos" : "start"}
        files={uploads ?? []}
      />
    </>
  );
}
