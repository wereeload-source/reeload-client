import Link from "next/link";
import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { StatusChip, Empty } from "@/components/ui";
import { day, inr, time } from "@/lib/format";
import { JOB_SELECT, liveAssignment, type Job } from "@/lib/types";

const FILTERS = ["all", "lead", "draft", "confirmed", "assigned", "accepted", "reached", "uploaded", "released", "paid"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ s?: string; q?: string }> }) {
  const { s = "all", q = "" } = await searchParams;
  const { supabase, me } = await requireProfile();
  const money = me.role !== "ops";

  if (me.role === "accounts") {
    // Accounts sees client names only, through the jobs_accounts view.
    let query = supabase.from("jobs_accounts").select("*").order("starts_at", { ascending: false });
    if (s !== "all") query = query.eq("status", s);
    const { data } = await query;
    return (
      <>
        <PageBar title="Jobs" />
        <Pane>
          <div className="card px-2 py-1.5">
            <table className="tbl"><thead><tr><th>Job</th><th>Client</th><th>City</th><th>Shoot</th><th>Status</th><th className="num">Total</th><th className="num">Balance</th></tr></thead>
              <tbody>{(data ?? []).map((j) => (
                <tr key={j.id}><td className="text-mute">{j.code}</td><td><b>{j.client_name}</b></td><td>{j.city}</td><td>{day(j.starts_at)}</td><td><StatusChip status={j.status} /></td>
                  <td className="num">{inr(Number(j.agreed_amount ?? 0) + Number(j.approved_changes ?? 0))}</td><td className="num">{inr(Math.max(0, Number(j.balance ?? 0)))}</td></tr>
              ))}</tbody></table>
          </div>
        </Pane>
      </>
    );
  }

  let query = supabase.from("jobs").select(JOB_SELECT).order("starts_at", { ascending: false, nullsFirst: true });
  if (s !== "all") query = query.eq("status", s);
  const [{ data: jobs }, { data: balances }] = await Promise.all([
    query,
    money ? supabase.from("job_balances").select("job_id, agreed_amount, approved_changes, balance") : Promise.resolve({ data: [] }),
  ]);
  const rows = ((jobs ?? []) as Job[]).filter((j) => !q || j.clients?.name.toLowerCase().includes(q.toLowerCase()) || j.clients?.phone.includes(q));
  const bal = (id: string) => (balances ?? []).find((b) => b.job_id === id);

  return (
    <>
      <PageBar title="Jobs">
        {(me.role === "sales" || me.role === "admin") && <Link href="/jobs/new" className="btn btn-pri">+ New job</Link>}
      </PageBar>
      <Pane>
        <form className="card flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <Link key={f} href={`/jobs?s=${f}`} className={`rounded-full border px-3 py-1 text-[13px] font-semibold capitalize ${s === f ? "border-ink bg-ink text-paper" : "border-line bg-paper text-mute"}`}>{f}</Link>
          ))}
          <span className="flex-1" />
          <input type="hidden" name="s" value={s} />
          <input name="q" defaultValue={q} placeholder="Search client or phone" className="input w-56" aria-label="Search" />
        </form>
        <div className="card px-2 py-1.5">
          {rows.length ? (
            <table className="tbl">
              <thead><tr><th>Job</th><th>Client</th><th>City</th><th>Shoot</th><th>Reelmaker</th><th>Status</th>{money && <><th className="num">Total</th><th className="num">Balance</th></>}</tr></thead>
              <tbody>
                {rows.map((j) => {
                  const b = bal(j.id);
                  return (
                    <tr key={j.id}>
                      <td className="whitespace-nowrap text-mute">{j.code}</td>
                      <td><b>{j.clients?.name}</b></td>
                      <td>{j.city}</td>
                      <td className="whitespace-nowrap">{day(j.starts_at)} · {time(j.starts_at)}</td>
                      <td>{liveAssignment(j)?.profiles?.full_name ?? <span className="text-mute">—</span>}</td>
                      <td><StatusChip status={j.status} /></td>
                      {money && <>
                        <td className="num">{b ? inr(Number(b.agreed_amount) + Number(b.approved_changes)) : "—"}</td>
                        <td className={`num ${b && Number(b.balance) <= 0 ? "text-ok" : ""}`}>{b ? inr(Math.max(0, Number(b.balance))) : "—"}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty>No jobs at this stage.</Empty>}
        </div>
      </Pane>
    </>
  );
}
