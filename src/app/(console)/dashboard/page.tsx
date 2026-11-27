import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Kpi, StatusChip, Empty } from "@/components/ui";
import { hoursSince, inr, isToday, time } from "@/lib/format";
import { JOB_SELECT, PIPELINE, liveAssignment as live, type Job } from "@/lib/types";
import { ApprovePriceChange } from "./approve";

export default async function Dashboard() {
  const { supabase } = await requireProfile();
  const [{ data: jobs }, { data: money }, { data: pending }, { data: hours }, { data: calls }, { data: audit }, { data: people }] = await Promise.all([
    supabase.from("jobs").select(JOB_SELECT).order("starts_at"),
    supabase.from("jobs_accounts").select("id, received, balance"),
    supabase.from("price_changes").select("id, delta, reason, jobs(code, clients(name))").eq("status", "pending"),
    supabase.from("reelmaker_hours").select("reelmaker_id, booked_hours, extra_hours"),
    supabase.from("contact_counts_today").select("*"),
    supabase.from("audit_log").select("id, at, action, entity, actor_id").order("at", { ascending: false }).limit(6),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const nameOf = (id: string | null) => (people ?? []).find((p) => p.id === id)?.full_name;

  const all = (jobs ?? []) as Job[];
  const today = all.filter((j) => isToday(j.starts_at));
  const unassigned = all.filter((j) => j.status === "confirmed");
  const received = (money ?? []).reduce((s, m) => s + Number(m.received ?? 0), 0);
  const outstanding = (money ?? []).reduce((s, m) => s + Math.max(0, Number(m.balance ?? 0)), 0);
  const maxH = Math.max(1, ...(hours ?? []).map((h) => Number(h.booked_hours) + Number(h.extra_hours)));

  return (
    <>
      <PageBar title="Dashboard" />
      <Pane>
        <div className="kpis">
          <Kpi label="Shoots today" value={today.length} note={`${today.filter((j) => j.status === "reached").length} on site now`} />
          <Kpi label="Unassigned" value={unassigned.length} alert={unassigned.length > 0}
            note={`${unassigned.filter((j) => hoursSince(j.confirmed_at) > 48).length} waiting over 48 hours`} />
          <Kpi label="Collected" value={inr(received)} />
          <Kpi label="Outstanding" value={inr(outstanding)} note={`across ${(money ?? []).filter((m) => Number(m.balance) > 0).length} jobs`} />
        </div>

        <div className="card">
          <h3>Jobs by stage</h3>
          <div className="grid grid-cols-5 gap-1 md:grid-cols-10">
            {PIPELINE.map((s) => {
              const n = all.filter((j) => j.status === s).length;
              const hot = s === "confirmed" && n > 0;
              return (
                <div key={s} className={`rounded-lg px-2 pb-1.5 pt-2 text-xs capitalize ${hot ? "bg-recs text-rec" : "bg-sub text-mute"}`}>
                  <b className={`block font-display text-lg ${hot ? "text-rec" : "text-ink"}`}>{n}</b>{s}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="card">
            <h3>Today&apos;s shoots</h3>
            {today.length ? today.map((j) => (
              <div key={j.id} className="flex items-center gap-3 border-b border-line px-1 py-2.5 last:border-0">
                <span className="w-14 flex-none font-mono text-[13px]">{time(j.starts_at)}</span>
                {live(j)?.profiles && <Avatar name={live(j)!.profiles!.full_name} />}
                <div className="flex-1"><b>{j.clients?.name}</b><div className="text-[13px] text-mute">{j.city} · {live(j)?.profiles?.full_name ?? "Unassigned"}</div></div>
                <StatusChip status={j.status} />
              </div>
            )) : <Empty>No shoots today.</Empty>}
          </div>
          <div className="grid content-start gap-4">
            <div className="card">
              <h3>Waiting for your approval</h3>
              {(pending ?? []).length ? (pending ?? []).map((p) => {
                const job = p.jobs as unknown as { code: string; clients: { name: string } } | null;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <div className="flex-1"><b>{job?.code} {p.reason}</b><div className="text-[13px] text-mute">+{inr(p.delta)} · {job?.clients?.name}</div></div>
                    <ApprovePriceChange id={p.id} />
                  </div>
                );
              }) : <div className="text-mute">Nothing to approve.</div>}
            </div>
            <div className="card">
              <h3>Hours this month</h3>
              {(hours ?? []).map((h) => {
                const total = Number(h.booked_hours) + Number(h.extra_hours);
                const name = nameOf(h.reelmaker_id) ?? "";
                return (
                  <div key={h.reelmaker_id} className="my-[7px] grid grid-cols-[84px_minmax(0,1fr)_48px] items-center gap-2.5">
                    <span>{name.split(" ")[0]}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-sub"><i className="block h-full rounded-full bg-ink" style={{ width: `${(total / maxH) * 100}%` }} /></span>
                    <span className="num">{total}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h3>Sales calls today</h3>
            <table className="tbl"><thead><tr><th>Salesperson</th><th className="num">Spoken</th><th className="num">Approved</th><th className="num">Rejected</th></tr></thead>
              <tbody>{(calls ?? []).map((c) => <tr key={c.salesperson_id}><td>{c.full_name}</td><td className="num">{c.spoken}</td><td className="num">{c.approved}</td><td className="num">{c.rejected}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="card">
            <h3>Audit log <small className="ml-auto text-[13px] font-medium text-mute">Cannot be edited</small></h3>
            {(audit ?? []).map((a) => (
              <div key={a.id} className="flex gap-3 border-b border-line py-2 text-sm last:border-0">
                <span className="w-[72px] flex-none font-mono text-[12.5px] text-mute">{time(a.at)}</span>
                <div><b>{nameOf(a.actor_id) ?? "System"}</b> {a.action} {a.entity}</div>
              </div>
            ))}
          </div>
        </div>
      </Pane>
    </>
  );
}
