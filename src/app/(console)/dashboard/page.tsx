import { ProgressBar } from "@heroui/react";
import { Cell, DataTable, Row } from "@/components/data-table";
import { LinkButton } from "@/components/link-button";
import { PageBar } from "@/components/page-bar";
import { Chip, Empty, Kpi, Kpis, Panel, StatusChip } from "@/components/ui";
import { dayTime, fullDay, inr, istDate, num, startsIn, time, window_ } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { liveAssignment, type AssignQueue, type Contacts, type Dashboard, type HoursRow, type Job, type Paged, type PriceChange } from "@/lib/types";
import { ApprovePriceChange } from "./approve";

const tomorrow = () => istDate(new Date(Date.now() + 86_400_000));
const soft = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

export default async function DashboardPage() {
  await requirePage("dashboard");
  const today = istDate();
  const todayRange = new URLSearchParams({ from: `${today}T00:00:00+05:30`, to: `${tomorrow()}T00:00:00+05:30`, limit: "50" });
  const [d, pending, todays, queue, hrs, contacts] = await Promise.all([
    api.get<Dashboard>("/dashboard"),
    soft(api.get<PriceChange[]>("/price-changes?status=pending"), []),
    soft(api.get<Paged<Job>>(`/jobs?${todayRange}`), { items: [], total: 0 }),
    soft(api.get<AssignQueue>("/assign/queue"), { unassigned: [], flagged: 0, awaiting_reply: [] }),
    soft(api.get<{ month: string; items: HoursRow[] }>(`/hours?month=${today.slice(0, 7)}`), { month: "", items: [] }),
    soft(api.get<Contacts>(`/contacts?date=${today}`), { date: today, counts: [], items: [] }),
  ]);
  const a = d.needs_attention;
  const shoots = todays.items
    .filter((j) => j.starts_at && j.status !== "cancelled")
    .sort((x, y) => x.starts_at!.localeCompare(y.starts_at!));
  const accepted = shoots.filter((j) => liveAssignment(j)?.status === "accepted").length;
  const awaiting = shoots.filter((j) => liveAssignment(j)?.status === "pending").length;
  const hours = [...hrs.items].sort((x, y) => y.total_hours - x.total_hours).slice(0, 6);
  const maxHours = Math.max(50, ...hours.map((h) => h.total_hours));
  const month = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "long" });

  return (
    <>
      <PageBar eyebrow={fullDay()} title="Today at Reeload">
        <LinkButton href="/jobs?s=paid" variant="outline">Create download link</LinkButton>
        <LinkButton href="/users">New user</LinkButton>
      </PageBar>

      <Kpis>
        <Kpi label="Today's shoots" value={d.today.shoots} note={`${accepted} accepted · ${awaiting} awaiting`} />
        <Kpi label="Unassigned jobs" value={a.unassigned.total} tone={a.unassigned.flagged ? "bad" : "neutral"} note={`${a.unassigned.flagged} inside 48 hours`} />
        <Kpi label="Collected this month" value={inr(d.money.received_this_month)} tone="ok" note="Advances and balances" />
        <Kpi label="Outstanding" value={inr(d.money.outstanding)} tone="warn" note={`Across ${d.money.jobs_owing} open jobs`} />
      </Kpis>

      <div className="flex flex-wrap items-stretch gap-4">
        <Panel title="Today's shoots" aside={<LinkButton href="/calendar" variant="ghost" size="sm">Open calendar</LinkButton>} className="flex-[2_1_520px]">
          <DataTable
            label="Today's shoots"
            isEmpty={!shoots.length}
            empty="No shoots today."
            columns={[{ label: "Time" }, { label: "Client" }, { label: "Reelmaker" }, { label: "Status" }]}
          >
            {shoots.map((j) => {
              const who = liveAssignment(j);
              return (
                <Row key={j.id} href={`/jobs/${j.id}`}>
                  <Cell className="font-mono text-[13px] whitespace-nowrap">{window_(j.starts_at, j.duration_minutes)}</Cell>
                  <Cell>
                    <div className="font-semibold">{j.client_name}</div>
                    <div className="text-xs text-mute">{j.city}</div>
                  </Cell>
                  <Cell className={who ? "" : "font-semibold text-bad"}>{who?.full_name ?? "Unassigned"}</Cell>
                  <Cell>{who ? <StatusChip status={j.status} /> : <Chip tone="bad">Needs reelmaker</Chip>}</Cell>
                </Row>
              );
            })}
          </DataTable>
        </Panel>

        <Panel
          title="Unassigned jobs"
          aside={a.unassigned.flagged ? <span className="text-xs text-bad">{a.unassigned.flagged} inside 48 hours</span> : undefined}
          className="flex-[1_1_320px]"
        >
          {queue.unassigned.length ? (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {queue.unassigned.slice(0, 6).map((j) => {
                const hot = (j.hours_to_start ?? Infinity) < 48;
                return (
                  <li key={j.id} className={`flex items-center justify-between gap-3 rounded-[10px] border p-3 ${hot ? "border-[#f5c9c5] bg-[#fdf1f0]" : "border-line bg-sub"}`}>
                    <div>
                      <div className="text-sm font-semibold">{j.client_name}</div>
                      <div className="text-xs text-mute2">{dayTime(j.starts_at)}</div>
                    </div>
                    <span className={`font-mono text-xs font-medium whitespace-nowrap ${hot ? "text-bad" : "text-mute2"}`}>{startsIn(j.hours_to_start)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Every job has a reelmaker.</Empty>
          )}
        </Panel>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Panel title={`Hours per reelmaker · ${month}`} className="flex-[1_1_300px]">
          {hours.length ? (
            hours.map((h) => (
              <ProgressBar key={h.reelmaker_id} value={h.total_hours} maxValue={maxHours} aria-label={`${h.full_name}: ${h.total_hours} hours`} size="sm" color="accent" className="gap-1.5">
                <div className="flex w-full justify-between text-[13px]">
                  <span className="font-medium">{h.full_name} <span className="text-mute">· {h.shoots} shoots</span></span>
                  <span className="font-mono">{h.total_hours} h</span>
                </div>
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            ))
          ) : (
            <Empty>No hours this month yet.</Empty>
          )}
          <p className="m-0 text-xs text-mute">Booked time plus extra time. Pay is worked out outside the app.</p>
        </Panel>

        <Panel title="Needs your approval" className="flex-[1_1_300px]">
          {pending.length ? (
            pending.map((p) => (
              <div key={p.id} className="flex flex-col gap-2.5 rounded-[10px] border border-line p-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-warn">Price change</div>
                  <div className="mt-0.5 text-sm">
                    {p.code} · {p.reason} · {num(p.delta) > 0 ? "+" : ""}{inr(p.delta)} asked by {p.requested_by_name ?? "Sales"}
                  </div>
                </div>
                <ApprovePriceChange id={p.id} />
              </div>
            ))
          ) : (
            <Empty>Nothing waiting for you.</Empty>
          )}
          {a.approvals.extra_time > 0 && <p className="m-0 text-xs text-mute">{a.approvals.extra_time} extra-time decisions are waiting in Review files.</p>}
        </Panel>

        <Panel title="Sales contacts today" className="flex-[1_1_300px]">
          <DataTable
            label="Sales contacts today"
            minWidth={260}
            isEmpty={!contacts.counts.length}
            empty="No calls logged today."
            columns={[{ label: "Person" }, { label: "Spoken", align: "end" }, { label: "Approved", align: "end" }, { label: "Rejected", align: "end" }]}
          >
            {contacts.counts.map((p) => (
              <Row key={p.salesperson_id}>
                <Cell className="font-medium">{p.full_name}</Cell>
                <Cell className="text-right font-mono">{p.spoken}</Cell>
                <Cell className="text-right font-mono text-ok">{p.approved}</Cell>
                <Cell className="text-right font-mono text-bad">{p.rejected}</Cell>
              </Row>
            ))}
          </DataTable>
          <h3 className="m-0 mt-2 font-sans text-[13px] font-semibold tracking-normal text-mute">Latest audit entries</h3>
          {d.recent_activity.length ? (
            d.recent_activity.slice(0, 5).map((e) => (
              <div key={e.id} className="flex gap-2.5 text-xs">
                <span className="font-mono whitespace-nowrap text-mute">{time(e.at)}</span>
                <span>{e.actor_name ?? "System"}: {e.action.replace(/_/g, " ")} {e.entity.replace(/_/g, " ")}</span>
              </div>
            ))
          ) : (
            <Empty>No activity yet.</Empty>
          )}
        </Panel>
      </div>

      <footer className="text-xs text-mute">Money is visible to Admin, Sales and Accounts only.</footer>
    </>
  );
}
