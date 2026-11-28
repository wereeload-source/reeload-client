import { AlertTriangle, BadgeIndianRupee, CalendarCheck, ClipboardList, History, PhoneCall, Wallet } from "lucide-react";
import Link from "next/link";
import { PageBar, Pane } from "@/components/page-bar";
import { Empty, Kpi, Panel } from "@/components/ui";
import { inr, time } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { PIPELINE, type Dashboard, type PriceChange } from "@/lib/types";
import { ApprovePriceChange } from "./approve";

export default async function DashboardPage() {
  await requirePage("dashboard");
  const [d, pending] = await Promise.all([
    api.get<Dashboard>("/dashboard"),
    api.get<PriceChange[]>("/price-changes?status=pending"),
  ]);
  const a = d.needs_attention;

  return (
    <>
      <PageBar title="Dashboard" />
      <Pane>
        <div className="kpis">
          <Kpi icon={CalendarCheck} label="Shoots today" value={d.today.shoots} note={`${d.today.reached} checked in`} />
          <Kpi icon={AlertTriangle} label="Unassigned" value={a.unassigned.total} alert={a.unassigned.flagged > 0} note={`${a.unassigned.flagged} starting soon`} />
          <Kpi icon={Wallet} label="Received this month" value={inr(d.money.received_this_month)} />
          <Kpi icon={BadgeIndianRupee} label="Outstanding" value={inr(d.money.outstanding)} note={`across ${d.money.jobs_owing} jobs`} />
        </div>

        <Panel title="Jobs by stage">
          <div className="grid grid-cols-4 gap-1 md:grid-cols-11">
            {PIPELINE.map((s) => {
              const n = d.jobs_by_status[s] ?? 0;
              const hot = s === "confirmed" && n > 0;
              return (
                <Link key={s} href={`/jobs?s=${s}`} className={`rounded-lg px-2 pb-1.5 pt-2 text-xs capitalize hover:outline hover:outline-line ${hot ? "bg-recs text-rec" : "bg-sub text-mute"}`}>
                  <b className={`block font-display text-lg ${hot ? "text-rec" : "text-ink"}`}>{n}</b>{s}
                </Link>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Panel title="Needs attention" icon={ClipboardList}>
            <ul className="grid gap-1.5 text-sm">
              <li><Link className="hover:underline" href="/assign">{a.unassigned.total} jobs waiting for a reelmaker</Link></li>
              <li><Link className="hover:underline" href="/review">{a.uploads_overdue} shoots with files overdue</Link></li>
              <li>{a.checkins_waiting} check-ins waiting for a code</li>
              <li>{a.approvals.extra_time} extra-time decisions pending</li>
            </ul>
          </Panel>
          <Panel title="Waiting for your approval" aside={`${pending.length}`}>
            {pending.length ? pending.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                <div className="flex-1">
                  <b>{p.code} · {p.reason}</b>
                  <div className="text-[13px] text-mute">{Number(p.delta) > 0 ? "+" : ""}{inr(p.delta)} · {p.client_name} · asked by {p.requested_by_name}</div>
                </div>
                <ApprovePriceChange id={p.id} />
              </div>
            )) : <Empty>Nothing to approve.</Empty>}
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Sales calls today" icon={PhoneCall}>
            <div className="grid grid-cols-4 text-center text-sm">
              {([["Spoken", d.sales_today.spoken], ["Approved", d.sales_today.approved], ["Rejected", d.sales_today.rejected], ["Follow-ups", d.sales_today.follow_ups]] as const).map(([l, v]) => (
                <div key={l}><b className="block font-display text-2xl">{v}</b><span className="text-mute">{l}</span></div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent activity" icon={History} aside="Cannot be edited">
            {d.recent_activity.length ? d.recent_activity.map((e) => (
              <div key={e.id} className="flex gap-3 border-b border-line py-2 text-sm last:border-0">
                <span className="w-[52px] flex-none font-mono text-[12.5px] text-mute">{time(e.at)}</span>
                <div><b>{e.actor_name ?? "System"}</b> {e.action.replace(/_/g, " ")} {e.entity.replace(/_/g, " ")}</div>
              </div>
            )) : <Empty>No activity yet.</Empty>}
          </Panel>
        </div>
      </Pane>
    </>
  );
}
