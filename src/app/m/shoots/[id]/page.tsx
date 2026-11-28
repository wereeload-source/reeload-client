import { ChevronLeft, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { day, time } from "@/lib/format";
import { ApiError, api, requireProfile } from "@/lib/session";
import type { CheckinState, Shoot, UploadRow } from "@/lib/types";
import { DropOut } from "../../respond";
import { ShootFlow, type Stage } from "./flow";

const STAGE: Record<CheckinState["step"], Stage> = { not_started: "start", code_sent: "otp", photos: "photos", done: "upload" };

export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const shoot = await api.get<Shoot>(`/me/shoots/${id}`).catch((e) => {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400 || e.status === 403)) notFound();
    throw e;
  });
  const accepted = shoot.assignment_status === "accepted";
  const [checkin, uploads] = accepted
    ? await Promise.all([api.get<CheckinState>(`/me/shoots/${id}/checkin`), api.get<UploadRow[]>(`/jobs/${id}/uploads`)])
    : [null, [] as UploadRow[]];
  const end = shoot.starts_at && shoot.duration_minutes ? new Date(new Date(shoot.starts_at).getTime() + shoot.duration_minutes * 60_000).toISOString() : null;
  const mapHref = shoot.maps_url ?? (shoot.address ? `https://maps.google.com/?q=${encodeURIComponent(`${shoot.address}, ${shoot.city}`)}` : null);

  return (
    <>
      <div className="flex items-center gap-2.5 py-2">
        <Link href="/m" aria-label="Back to my shoots" className="grid size-9 place-items-center rounded-full bg-sub"><ChevronLeft aria-hidden className="size-5" /></Link>
        <h1 className="font-display text-xl font-bold tracking-tight">{shoot.client_name}</h1>
      </div>
      <div className="mcard">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-sm">
          <dt className="text-mute">When</dt><dd className="font-medium">{day(shoot.starts_at)}, {time(shoot.starts_at)} – {time(end)}</dd>
          <dt className="text-mute">Where</dt><dd className="font-medium">{shoot.address ?? shoot.city}</dd>
          {shoot.onsite_contact_name && <><dt className="text-mute">On site</dt><dd className="font-medium">{shoot.onsite_contact_name} · <a className="font-mono" href={`tel:${shoot.onsite_contact_phone}`}>{shoot.onsite_contact_phone}</a></dd></>}
          <dt className="text-mute">Job</dt><dd className="font-medium">{shoot.code}</dd>
        </dl>
        {mapHref && (
          <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mbtn mbtn-ghost mt-3 min-h-11"><MapIcon aria-hidden className="size-4" /> Open in Google Maps</a>
        )}
      </div>
      {shoot.brief && <div className="mcard"><b>Brief</b><p className="mt-1.5 whitespace-pre-line text-sm">{shoot.brief}</p></div>}
      {accepted && checkin ? (
        <>
          <ShootFlow jobId={id} stage={STAGE[checkin.step]} sendsLeft={checkin.sends_left} resendIn={checkin.resend_in_seconds} files={uploads} />
          {checkin.step === "not_started" && <div className="mt-4 text-center"><DropOut jobId={id} /></div>}
        </>
      ) : (
        <p className="mcard text-sm text-mute">Accept this shoot on the My shoots page to start the check-in.</p>
      )}
    </>
  );
}
