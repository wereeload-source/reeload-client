import { BadgeIndianRupee, CheckCircle2, FileDown, Handshake, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { PageBar, Pane } from "@/components/page-bar";
import { Empty, Kpi, Panel, StatusChip } from "@/components/ui";
import { inr, num } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import type { Ledger } from "@/lib/types";
import { RecordPayment } from "./record";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string; owing?: string }> }) {
  const { me } = await requirePage("payments");
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const owing = sp.owing === "1";
  const qs = new URLSearchParams({ limit: "500" });
  if (q) qs.set("q", q);
  if (owing) qs.set("outstanding", "true");
  const ledger = await api.get<Ledger>(`/ledger?${qs}`);
  const rows = ledger.items.filter((r) => r.agreed_amount !== null);
  const canRecord = me.role === "accounts" || me.role === "admin";
  const t = ledger.totals;

  return (
    <>
      <PageBar title="Payments">
        {canRecord && (
          // A plain link: the browser downloads the CSV through the signed-in proxy.
          <a href={`/api/proxy/ledger.csv?${qs}`} className="button button--secondary button--sm" download>
            <FileDown aria-hidden className="size-4" /> Export CSV
          </a>
        )}
      </PageBar>
      <Pane>
        <div className="kpis">
          <Kpi icon={Handshake} label="Agreed" value={inr(t.total)} note={`${t.jobs} jobs`} />
          <Kpi icon={Wallet} label="Received" value={inr(t.received)} />
          <Kpi icon={BadgeIndianRupee} label="Balance due" value={inr(t.outstanding)} alert={t.outstanding > 0} />
          <Kpi icon={CheckCircle2} label="Fully paid" value={rows.filter((r) => num(r.balance) <= 0).length} />
        </div>
        <form className="flex flex-wrap items-center gap-2" role="search">
          <label className="relative">
            <span className="sr-only">Search</span>
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <input name="q" defaultValue={q} placeholder="Client, city or RL-1001" maxLength={80} className="field w-64 pl-8" />
          </label>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="owing" value="1" defaultChecked={owing} className="accent-rec" /> Only jobs that owe money</label>
          <button className="button button--secondary button--sm">Apply</button>
        </form>
        <Panel flush>
          {rows.length ? (
            <table className="tbl">
              <thead><tr><th>Job</th><th>Client</th><th>Status</th><th className="num">Total</th><th className="num">Advance</th><th className="num">Received</th><th className="num">Balance</th>{canRecord && <th />}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const balance = num(r.balance);
                  return (
                    <tr key={r.id}>
                      <td className="text-mute">{me.role === "accounts" ? r.code : <Link className="text-rec hover:underline" href={`/jobs/${r.id}`}>{r.code}</Link>}</td>
                      <td><b>{r.client_name}</b><div className="text-[12.5px] text-mute">{r.city}</div></td>
                      <td><StatusChip status={r.status} /></td>
                      <td className="num">{inr(num(r.agreed_amount) + num(r.approved_changes))}</td>
                      <td className="num">{inr(r.advance)}</td>
                      <td className="num">{inr(r.received)}</td>
                      <td className={`num font-bold ${balance <= 0 ? "text-ok" : ""}`}>{balance > 0 ? inr(balance) : "Paid"}</td>
                      {canRecord && (
                        <td className="num">
                          {balance > 0 && !["lead", "draft", "cancelled"].includes(r.status) && <RecordPayment jobId={r.id} code={r.code} balance={balance} />}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty icon={Wallet}>No jobs with an agreed amount match.</Empty>}
        </Panel>
      </Pane>
    </>
  );
}
