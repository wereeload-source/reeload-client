import { Card } from "@heroui/react";
import { notFound } from "next/navigation";
import { isToday, longDay, window_ } from "@/lib/format";
import { ApiError, api, requireProfile } from "@/lib/session";
import type { CheckinState, Shoot, UploadRow } from "@/lib/types";
import { MHeader, MMain } from "../../header";
import { DropOut, Respond } from "../../respond";
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
  const mapHref = shoot.maps_url ?? (shoot.address ? `https://maps.google.com/?q=${encodeURIComponent(`${shoot.address}, ${shoot.city}`)}` : null);
  const when = `${isToday(shoot.starts_at) ? "Today" : longDay(shoot.starts_at)} · ${window_(shoot.starts_at, shoot.duration_minutes)}`;

  if (!accepted || !checkin) {
    return (
      <>
        <MHeader title={shoot.client_name} subtitle="New request" back="/m" />
        <MMain>
          <Card className="gap-3 p-4">
            <div className="font-mono text-[13px]">{when}</div>
            <div className="text-sm text-mute2">{shoot.address ? `${shoot.address}, ${shoot.city}` : shoot.city}</div>
            {shoot.brief && <div className="rounded-[10px] bg-sub p-3 text-sm"><strong>Brief.</strong> {shoot.brief}</div>}
            {shoot.assignment_status === "pending" ? <Respond jobId={id} /> : <p className="m-0 text-sm text-mute">This shoot is no longer yours.</p>}
          </Card>
        </MMain>
      </>
    );
  }

  return (
    <ShootFlow
      jobId={id}
      shoot={{
        client: shoot.client_name,
        code: shoot.code,
        when,
        address: shoot.address ? `${shoot.address}, ${shoot.city}` : shoot.city,
        mapHref,
        contactName: shoot.onsite_contact_name,
        contactPhone: shoot.onsite_contact_phone,
        brief: shoot.brief,
      }}
      stage={STAGE[checkin.step]}
      sendsLeft={checkin.sends_left}
      resendIn={checkin.resend_in_seconds}
      files={uploads}
      dropOut={checkin.step === "not_started" ? <DropOut jobId={id} /> : undefined}
    />
  );
}
