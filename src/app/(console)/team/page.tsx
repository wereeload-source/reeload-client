import { Cell, DataTable, Row } from "@/components/data-table";
import { DateJump } from "@/components/date-jump";
import { PageBar } from "@/components/page-bar";
import { Avatar, Chip, Panel } from "@/components/ui";
import { istDate } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import type { HoursRow, Reelmaker } from "@/lib/types";

// Hours only: the system does not calculate pay.
export default async function TeamPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requirePage("team");
  const { month: raw } = await searchParams;
  const month = raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : istDate().slice(0, 7);
  const [reelmakers, hours] = await Promise.all([
    api.get<Reelmaker[]>("/reelmakers?include_inactive=true"),
    api.get<{ month: string; items: HoursRow[] }>(`/hours?month=${month}`),
  ]);

  return (
    <>
      <PageBar title="Reelmakers and leave" note="Booked time plus extra time. Pay is worked out outside the app." />
      <DateJump action="/team" name="month" label="Month" type="month" value={month} />
      <Panel title="Hours this month">
        <DataTable
          label="Reelmaker hours"
          minWidth={620}
          isEmpty={!reelmakers.length}
          empty="No reelmakers yet. Admin adds them under Users."
          columns={[{ label: "Reelmaker" }, { label: "Type" }, { label: "Phone" }, { label: "Shoots", align: "end" }, { label: "Hours", align: "end" }]}
        >
          {reelmakers.map((r) => {
            const h = hours.items.find((x) => x.reelmaker_id === r.id);
            return (
              <Row key={r.id}>
                <Cell>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.full_name} />
                    <div>
                      <div className="font-semibold">{r.full_name}</div>
                      <div className="text-xs text-mute">{r.base_city}</div>
                    </div>
                  </div>
                </Cell>
                <Cell>
                  <span className="flex items-center gap-2">
                    {r.kind === "full_time" ? "Full-time" : "Freelance"} {!r.active && <Chip>Inactive</Chip>}
                  </span>
                </Cell>
                <Cell className="font-mono text-[13px]">{r.phone}</Cell>
                <Cell className="text-right font-mono">{h?.shoots ?? 0}</Cell>
                <Cell className="text-right font-mono">
                  {h?.total_hours ?? 0} h{(h?.extra_hours ?? 0) > 0 && <span className="text-mute"> (incl. {h!.extra_hours} h extra)</span>}
                </Cell>
              </Row>
            );
          })}
        </DataTable>
      </Panel>
      <p className="m-0 text-[13px] text-mute">Leave is added and removed on the Unassigned page, where it blocks bookings.</p>
    </>
  );
}
