import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { day, hours, isToday, time } from "@/lib/format";
import { api, requireProfile } from "@/lib/session";
import type { Shoot } from "@/lib/types";
import { Respond } from "./respond";

export default async function MyShoots() {
  await requireProfile();
  const shoots = (await api.get<Shoot[]>("/me/shoots?when=upcoming")).sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
  const requests = shoots.filter((r) => r.assignment_status === "pending");
  const accepted = shoots.filter((r) => r.assignment_status === "accepted");
  const today = accepted.filter((r) => isToday(r.starts_at));
  const later = accepted.filter((r) => !isToday(r.starts_at));

  return (
    <>
      <h1 className="py-2 font-display text-[26px] font-bold tracking-tight">My shoots</h1>
      {today.map((r) => (
        <div key={r.job_id} className="mcard bg-[radial-gradient(120%_90%_at_100%_0%,#3a1310_0%,#121417_55%)] text-white">
          <div className="flex justify-between text-[13px] text-[#a6acb6]"><span>Today · {time(r.starts_at)}</span><span className="rounded bg-[#3a1714] px-1.5 capitalize text-[#ff7a6e]">{r.status}</span></div>
          <h2 className="mb-0.5 mt-1.5 text-[22px]">{r.client_name}</h2>
          <div className="flex items-center gap-1 text-sm text-[#a6acb6]"><MapPin aria-hidden className="size-3.5" />{r.address ?? r.city}</div>
          <Link href={`/m/shoots/${r.job_id}`} className="mbtn mt-3.5">Open shoot</Link>
        </div>
      ))}
      {requests.map((r) => (
        <div key={r.job_id} className="mcard">
          <div className="flex justify-between"><b>New request</b><span className="text-[13px] text-mute">{day(r.starts_at)} · {time(r.starts_at)}</span></div>
          <div className="mb-2.5 mt-1">{r.client_name} · {r.city} · {hours(r.duration_minutes)}</div>
          {r.brief && <p className="mb-2.5 text-sm text-mute">{r.brief}</p>}
          <Respond jobId={r.job_id} />
        </div>
      ))}
      <h2 className="mx-1 mb-2 mt-4 font-bold">Coming up</h2>
      {later.length ? later.map((r) => (
        <Link key={r.job_id} href={`/m/shoots/${r.job_id}`} className="mcard flex items-center gap-2.5 px-3.5 py-3">
          <div className="w-[58px]"><b>{day(r.starts_at)}</b><div className="text-[13px] text-mute">{time(r.starts_at)}</div></div>
          <div className="flex-1">{r.client_name}<div className="text-[13px] text-mute">{r.city}</div></div>
          <ChevronRight aria-hidden className="size-4 text-mute" />
        </Link>
      )) : <p className="mx-1 text-mute">Nothing else booked.</p>}
    </>
  );
}
