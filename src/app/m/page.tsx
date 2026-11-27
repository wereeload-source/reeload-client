import Link from "next/link";
import { requireProfile } from "@/lib/supabase/server";
import { day, isToday, time } from "@/lib/format";
import { Respond } from "./respond";

export default async function MyShoots() {
  const { supabase, me } = await requireProfile();
  const { data } = await supabase.from("assignments")
    .select("id, status, jobs(id, code, status, starts_at, duration_minutes, city, address, clients(name))")
    .eq("reelmaker_id", me.id).in("status", ["pending", "accepted"]);
  type Row = { id: string; status: string; jobs: { id: string; code: string; status: string; starts_at: string; duration_minutes: number; city: string; address: string | null; clients: { name: string } | null } };
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => a.jobs.starts_at.localeCompare(b.jobs.starts_at));
  const requests = rows.filter((r) => r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");
  const today = accepted.filter((r) => isToday(r.jobs.starts_at));
  const later = accepted.filter((r) => !isToday(r.jobs.starts_at));

  return (
    <>
      <h2 className="py-2 font-display text-[26px] font-bold tracking-tight">My shoots</h2>
      {today.map((r) => (
        <div key={r.id} className="mcard bg-[radial-gradient(120%_90%_at_100%_0%,#3a1310_0%,#121417_55%)] text-white">
          <div className="flex justify-between text-[13px] text-[#a6acb6]"><span>Today · {time(r.jobs.starts_at)}</span><span className="rounded bg-[#3a1714] px-1.5 text-[#ff7a6e]">{r.jobs.status === "accepted" ? "Today" : r.jobs.status}</span></div>
          <h3 className="mb-0.5 mt-1.5 text-[22px]">{r.jobs.clients?.name}</h3>
          <div className="text-sm text-[#a6acb6]">{r.jobs.address ?? r.jobs.city}</div>
          <Link href={`/m/shoots/${r.jobs.id}`} className="mbtn mt-3.5">Open shoot</Link>
        </div>
      ))}
      {requests.map((r) => (
        <div key={r.id} className="mcard">
          <div className="flex justify-between"><b>New request</b><span className="text-[13px] text-mute">{day(r.jobs.starts_at)} · {time(r.jobs.starts_at)}</span></div>
          <div className="mb-2.5 mt-1">{r.jobs.clients?.name} · {r.jobs.city} · {r.jobs.duration_minutes / 60}h</div>
          <Respond assignmentId={r.id} />
        </div>
      ))}
      <div className="mx-1 mb-2 mt-4 font-bold">Coming up</div>
      {later.length ? later.map((r) => (
        <Link key={r.id} href={`/m/shoots/${r.jobs.id}`} className="mcard flex items-center gap-2.5 px-3.5 py-3">
          <div className="w-[58px]"><b>{day(r.jobs.starts_at)}</b><div className="text-[13px] text-mute">{time(r.jobs.starts_at)}</div></div>
          <div className="flex-1">{r.jobs.clients?.name}</div>
        </Link>
      )) : <p className="mx-1 text-mute">Nothing else booked.</p>}
    </>
  );
}
