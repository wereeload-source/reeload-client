import { requireProfile } from "@/lib/supabase/server";
import { day } from "@/lib/format";

export default async function MyHours() {
  const { supabase, me } = await requireProfile();
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const [{ data: sum }, { data: shoots }] = await Promise.all([
    supabase.from("reelmaker_hours").select("*").eq("reelmaker_id", me.id).eq("month", month.toISOString().slice(0, 10)).maybeSingle(),
    supabase.from("assignments").select("id, time_range, jobs(starts_at, duration_minutes, clients(name))")
      .eq("reelmaker_id", me.id).eq("status", "accepted").order("created_at", { ascending: false }).limit(20),
  ]);
  const total = sum ? Number(sum.booked_hours) + Number(sum.extra_hours) : 0;
  type Row = { id: string; jobs: { starts_at: string; duration_minutes: number; clients: { name: string } | null } };
  return (
    <>
      <h2 className="py-2 font-display text-[26px] font-bold tracking-tight">My hours</h2>
      <div className="mcard bg-[radial-gradient(120%_90%_at_100%_0%,#3a1310_0%,#121417_55%)] text-white">
        <span className="text-[13px] text-[#a6acb6]">This month</span>
        <div className="font-display text-[44px] font-extrabold">{total}h</div>
        <div className="text-sm text-[#a6acb6]">{sum?.shoots ?? 0} shoots · includes {sum?.extra_hours ?? 0}h extra time</div>
      </div>
      {((shoots ?? []) as unknown as Row[]).map((s) => (
        <div key={s.id} className="mcard flex items-center gap-2.5 px-3.5 py-3">
          <b className="w-[60px]">{day(s.jobs.starts_at)}</b><span className="flex-1">{s.jobs.clients?.name}</span><span className="font-semibold">{s.jobs.duration_minutes / 60}h</span>
        </div>
      ))}
    </>
  );
}
