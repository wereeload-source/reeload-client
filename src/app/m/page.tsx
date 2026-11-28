import { Card } from "@heroui/react";
import { LinkButton } from "@/components/link-button";
import { Chip, Empty } from "@/components/ui";
import { fullDay, hours, isToday, istDate, longDay, window_ } from "@/lib/format";
import { api, requireProfile } from "@/lib/session";
import type { HoursRow, Notifications, Shoot } from "@/lib/types";
import { MHeader, MMain } from "./header";
import { Respond } from "./respond";

export default async function MyShoots() {
  const { me } = await requireProfile();
  const [all, sum, unread] = await Promise.all([
    api.get<Shoot[]>("/me/shoots?when=upcoming"),
    api.get<{ month: string; items: HoursRow[] }>(`/hours?month=${istDate().slice(0, 7)}`).catch(() => ({ month: "", items: [] as HoursRow[] })),
    api.get<Notifications>("/notifications?unread=true&limit=1").then((n) => n.unread, () => 0),
  ]);
  const shoots = all
    .filter((s) => s.assignment_status === "pending" || s.assignment_status === "accepted")
    .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
  const today = shoots.filter((s) => isToday(s.starts_at)).length;
  const h = sum.items[0];

  return (
    <>
      <MHeader title="My shoots" subtitle={`${me.full_name} · Reelmaker`} me={{ full_name: me.full_name, email: me.email, role: me.role }} unread={unread} />
      <MMain>
        <div className="text-[13px] font-medium text-mute">
          {fullDay().replace(/,? \d{4}$/, "")} · {today} {today === 1 ? "shoot" : "shoots"} today
        </div>

        {shoots.length ? (
          shoots.map((s) => {
            const pending = s.assignment_status === "pending";
            return (
              <Card key={s.job_id} className="gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] font-medium">
                    {isToday(s.starts_at) ? "Today" : longDay(s.starts_at)} · {window_(s.starts_at, s.duration_minutes)}
                  </span>
                  {pending ? <Chip tone="warn">Awaiting accept</Chip> : <Chip tone="ok">Accepted</Chip>}
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">{s.client_name}</div>
                  <div className="mt-0.5 text-sm text-mute2">{s.address ? `${s.address}, ${s.city}` : s.city} · {hours(s.duration_minutes)}</div>
                </div>
                {pending && s.brief && <p className="m-0 text-sm text-mute2">{s.brief}</p>}
                {pending ? (
                  <Respond jobId={s.job_id} />
                ) : (
                  <LinkButton href={`/m/shoots/${s.job_id}`} size="lg" className="w-full bg-ink">Open job</LinkButton>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="p-4"><Empty>No shoots booked. New requests appear here.</Empty></Card>
        )}

        <Card className="flex-row items-center justify-between p-4">
          <div>
            <div className="text-[13px] text-mute">My hours this month</div>
            <div className="font-display text-[26px] font-bold">{h?.total_hours ?? 0} h</div>
          </div>
          <LinkButton href="/m/hours" variant="ghost" className="font-semibold text-rec">Details</LinkButton>
        </Card>
      </MMain>
    </>
  );
}
