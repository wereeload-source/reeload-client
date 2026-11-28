import { Card } from "@heroui/react";
import { Cell, DataTable, Row } from "@/components/data-table";
import { day, hours, istDate } from "@/lib/format";
import { api, requireProfile } from "@/lib/session";
import type { HoursRow, Shoot } from "@/lib/types";
import { MHeader, MMain } from "../header";

export default async function MyHours() {
  await requireProfile();
  const month = istDate().slice(0, 7);
  const [sum, past] = await Promise.all([
    api.get<{ month: string; items: HoursRow[] }>(`/hours?month=${month}`),
    api.get<Shoot[]>("/me/shoots?when=past"),
  ]);
  const h = sum.items[0];
  const thisMonth = past.filter((s) => s.assignment_status === "accepted" && s.starts_at && istDate(new Date(s.starts_at)).startsWith(month));
  const monthName = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" });

  return (
    <>
      <MHeader title="My hours" subtitle={monthName} back="/m" />
      <MMain>
        <Card className="gap-1 p-4">
          <div className="text-[13px] text-mute">This month</div>
          <div className="font-display text-[34px] font-bold leading-none">{h?.total_hours ?? 0} h</div>
          <div className="text-[13px] text-mute2">{h?.shoots ?? 0} shoots · includes {h?.extra_hours ?? 0} h extra time</div>
        </Card>
        <Card className="p-4">
          <DataTable label="Shoots this month" minWidth={280} isEmpty={!thisMonth.length} empty="No shoots done this month yet." columns={[{ label: "Day" }, { label: "Client" }, { label: "Hours", align: "end" }]}>
            {thisMonth.map((s) => (
              <Row key={s.job_id}>
                <Cell className="font-mono text-[13px]">{day(s.starts_at)}</Cell>
                <Cell>{s.client_name}</Cell>
                <Cell className="text-right font-mono">{hours((s.duration_minutes ?? 0) + (s.extra_minutes ?? 0))}</Cell>
              </Row>
            ))}
          </DataTable>
        </Card>
        <p className="m-0 px-1 text-xs text-mute">Booked time plus extra time. Pay is worked out outside the app.</p>
      </MMain>
    </>
  );
}
