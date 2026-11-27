import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Kpi, StatusChip } from "@/components/ui";
import { inr } from "@/lib/format";
import { RecordPayment } from "./record";

export default async function PaymentsPage() {
  const { supabase, me } = await requireProfile();
  const { data } = await supabase.from("jobs_accounts").select("*").not("agreed_amount", "is", null).order("code", { ascending: false });
  const rows = data ?? [];
  const total = (r: (typeof rows)[number]) => Number(r.agreed_amount) + Number(r.approved_changes);
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  return (
    <>
      <PageBar title="Payments" />
      <Pane>
        <div className="kpis">
          <Kpi label="Agreed" value={inr(sum(total))} />
          <Kpi label="Received" value={inr(sum((r) => Number(r.received)))} />
          <Kpi label="Balance due" value={inr(sum((r) => Math.max(0, Number(r.balance))))} alert />
          <Kpi label="Paid jobs" value={rows.filter((r) => Number(r.balance) <= 0).length} />
        </div>
        <div className="card px-2 py-1.5">
          <table className="tbl">
            <thead><tr><th>Job</th><th>Client</th><th>Status</th><th className="num">Total</th><th className="num">Advance</th><th className="num">Received</th><th className="num">Balance</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-mute">{r.code}</td><td><b>{r.client_name}</b></td><td><StatusChip status={r.status} /></td>
                  <td className="num">{inr(total(r))}</td><td className="num">{inr(r.advance)}</td><td className="num">{inr(r.received)}</td>
                  <td className={`num font-bold ${Number(r.balance) <= 0 ? "text-ok" : ""}`}>{Number(r.balance) > 0 ? inr(r.balance) : "Paid"}</td>
                  <td className="num">{Number(r.balance) > 0 && (me.role === "accounts" || me.role === "admin") && <RecordPayment jobId={r.id} code={r.code} balance={Number(r.balance)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Pane>
    </>
  );
}
