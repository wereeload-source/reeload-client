import { Users } from "lucide-react";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip, Empty, Panel } from "@/components/ui";
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
      <PageBar title="Reelmakers">
        <form className="flex items-center gap-2 text-sm">
          <label htmlFor="month" className="text-mute">Month</label>
          <input id="month" name="month" type="month" defaultValue={month} className="field w-40" />
          <button className="button button--secondary button--sm">Show</button>
        </form>
      </PageBar>
      <Pane>
        <Panel flush>
          {reelmakers.length ? (
            <table className="tbl">
              <thead><tr><th>Reelmaker</th><th>Type</th><th>Phone</th><th className="num">Shoots</th><th className="num">Hours</th></tr></thead>
              <tbody>
                {reelmakers.map((r) => {
                  const h = hours.items.find((x) => x.reelmaker_id === r.id);
                  return (
                    <tr key={r.id}>
                      <td><div className="flex items-center gap-2.5"><Avatar name={r.full_name} /><div><b>{r.full_name}</b><div className="text-[12.5px] text-mute">{r.base_city}</div></div></div></td>
                      <td className="capitalize">{r.kind.replace("_", "-")} {!r.active && <Chip>Inactive</Chip>}</td>
                      <td className="font-mono">{r.phone}</td>
                      <td className="num">{h?.shoots ?? 0}</td>
                      <td className="num">{h?.total_hours ?? 0}h{(h?.extra_hours ?? 0) > 0 && <span className="text-mute"> incl. {h!.extra_hours}h extra</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty icon={Users}>No reelmakers yet. Admin adds them under Users.</Empty>}
        </Panel>
      </Pane>
    </>
  );
}
