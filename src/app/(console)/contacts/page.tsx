import { CheckCircle2, MessagesSquare, PhoneCall, Repeat, XCircle } from "lucide-react";
import { PageBar, Pane } from "@/components/page-bar";
import { Chip, Empty, Kpi, Panel } from "@/components/ui";
import { istDate, longDay, time } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { OUTCOME_LABEL, type Contacts } from "@/lib/types";
import { LogCall } from "./log-call";

const TONE = { approved: "ok", rejected: "rec", follow_up: "blue", spoken: undefined } as const;

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { me } = await requirePage("contacts");
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : istDate();
  const data = await api.get<Contacts>(`/contacts?date=${date}`);
  const rows = data.items;
  const n = (o: string) => rows.filter((r) => r.outcome === o).length;

  return (
    <>
      <PageBar title="Contact log"><LogCall /></PageBar>
      <Pane>
        <form className="flex items-center gap-2 text-sm">
          <label htmlFor="date" className="text-mute">Day</label>
          <input id="date" name="date" type="date" defaultValue={date} className="input w-44" />
          <button className="button button--secondary button--sm">Show</button>
          <span className="text-mute">{longDay(`${date}T12:00:00+05:30`)}</span>
        </form>
        <div className="kpis">
          <Kpi icon={PhoneCall} label="Spoken" value={rows.length} />
          <Kpi icon={CheckCircle2} label="Approved" value={n("approved")} />
          <Kpi icon={XCircle} label="Rejected" value={n("rejected")} />
          <Kpi icon={Repeat} label="Follow-ups" value={n("follow_up")} />
        </div>
        {me.role === "admin" && data.counts.length > 1 && (
          <Panel title="By salesperson" flush>
            <table className="tbl">
              <thead><tr><th>Salesperson</th><th className="num">Spoken</th><th className="num">Approved</th><th className="num">Rejected</th><th className="num">Follow-ups</th></tr></thead>
              <tbody>{data.counts.map((c) => <tr key={c.salesperson_id}><td>{c.full_name}</td><td className="num">{c.spoken}</td><td className="num">{c.approved}</td><td className="num">{c.rejected}</td><td className="num">{c.follow_ups}</td></tr>)}</tbody>
            </table>
          </Panel>
        )}
        <Panel flush>
          {rows.length ? (
            <table className="tbl">
              <thead><tr><th>Time</th><th>Client</th><th>Phone</th><th>Outcome</th><th>Note</th>{me.role === "admin" && <th>By</th>}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-mute">{time(r.created_at)}</td>
                    <td><b>{r.client_name}</b></td>
                    <td className="font-mono">{r.phone}</td>
                    <td><Chip tone={TONE[r.outcome]}>{OUTCOME_LABEL[r.outcome]}</Chip></td>
                    <td className="text-mute">{r.note}</td>
                    {me.role === "admin" && <td>{r.salesperson_name}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={MessagesSquare}>No calls logged on this day.</Empty>}
        </Panel>
      </Pane>
    </>
  );
}
