import { day, hours, istDate } from "@/lib/format";
import { api, requireProfile } from "@/lib/session";
import type { HoursRow, Shoot } from "@/lib/types";

export default async function MyHours() {
  await requireProfile();
  const month = istDate().slice(0, 7);
  const [sum, past] = await Promise.all([
    api.get<{ month: string; items: HoursRow[] }>(`/hours?month=${month}`),
    api.get<Shoot[]>("/me/shoots?when=past"),
  ]);
  const h = sum.items[0];
  const thisMonth = past.filter((s) => s.assignment_status === "accepted" && s.starts_at && istDate(new Date(s.starts_at)).startsWith(month));

  return (
    <>
      <h1 className="py-2 font-display text-[26px] font-bold tracking-tight">My hours</h1>
      <div className="mcard bg-[radial-gradient(120%_90%_at_100%_0%,#3a1310_0%,#121417_55%)] text-white">
        <span className="text-[13px] text-[#a6acb6]">This month</span>
        <div className="font-display text-[44px] font-extrabold">{h?.total_hours ?? 0}h</div>
        <div className="text-sm text-[#a6acb6]">{h?.shoots ?? 0} shoots · includes {h?.extra_hours ?? 0}h extra time</div>
      </div>
      {thisMonth.map((s) => (
        <div key={s.job_id} className="mcard flex items-center gap-2.5 px-3.5 py-3">
          <b className="w-[60px]">{day(s.starts_at)}</b>
          <span className="flex-1">{s.client_name}</span>
          <span className="font-semibold">{hours((s.duration_minutes ?? 0) + (s.extra_minutes ?? 0))}</span>
        </div>
      ))}
    </>
  );
}
