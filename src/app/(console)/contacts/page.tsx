import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Kpi, Chip, Empty } from "@/components/ui";
import { time } from "@/lib/format";
import { LogCall } from "./log-call";

const TONE = { approved: "ok", rejected: "rec", follow_up: "blue", spoken: undefined } as const;

export default async function ContactsPage() {
  const { supabase, me } = await requireProfile();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { data } = await supabase.from("contact_log").select("*").gte("created_at", start.toISOString()).order("created_at", { ascending: false });
  const rows = data ?? [];
  const n = (o: string) => rows.filter((r) => r.outcome === o).length;
  return (
    <>
      <PageBar title="Contact log">{(me.role === "sales" || me.role === "admin") && <LogCall />}</PageBar>
      <Pane>
        <div className="kpis">
          <Kpi label="Spoken today" value={rows.length} /><Kpi label="Approved" value={n("approved")} />
          <Kpi label="Rejected" value={n("rejected")} /><Kpi label="Follow-ups" value={n("follow_up")} />
        </div>
        <div className="card px-2 py-1.5">
          {rows.length ? (
            <table className="tbl"><thead><tr><th>Time</th><th>Client</th><th>Phone</th><th>Outcome</th><th>Note</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}><td className="text-mute">{time(r.created_at)}</td><td><b>{r.client_name}</b></td><td className="font-mono">{r.phone}</td>
                  <td><Chip tone={TONE[r.outcome as keyof typeof TONE]}>{r.outcome.replace("_", " ")}</Chip></td><td className="text-mute">{r.note}</td></tr>
              ))}</tbody></table>
          ) : <Empty>No calls logged today.</Empty>}
        </div>
      </Pane>
    </>
  );
}
