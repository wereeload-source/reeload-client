import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Cell, DataTable, Row } from "@/components/data-table";
import { PageBar } from "@/components/page-bar";
import { Chip, Empty, Panel, StatusChip } from "@/components/ui";
import { istDate, longDay, window_ } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { liveAssignment, type Job, type Paged } from "@/lib/types";

const DAYS = 14;
const HIDDEN = new Set(["cancelled", "lead", "draft"]);

const shift = (date: string, days: number) => istDate(new Date(new Date(`${date}T12:00:00+05:30`).getTime() + days * 86_400_000));

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requirePage("calendar");
  const { from: raw } = await searchParams;
  const from = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : istDate();
  const qs = new URLSearchParams({
    from: `${from}T00:00:00+05:30`,
    to: `${shift(from, DAYS)}T00:00:00+05:30`,
    limit: "500",
  });
  const { items } = await api.get<Paged<Job>>(`/jobs?${qs}`);
  const jobs = items.filter((j) => j.starts_at && !HIDDEN.has(j.status)).sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  const days = [...new Set(jobs.map((j) => istDate(new Date(j.starts_at!))))];

  return (
    <>
      <PageBar title="Calendar">
        <LinkButton href={`/calendar?from=${shift(from, -DAYS)}`} variant="outline" size="sm"><ChevronLeft aria-hidden className="size-4" /> Earlier</LinkButton>
        <LinkButton href="/calendar" variant="outline" size="sm">Today</LinkButton>
        <LinkButton href={`/calendar?from=${shift(from, DAYS)}`} variant="outline" size="sm">Later <ChevronRight aria-hidden className="size-4" /></LinkButton>
      </PageBar>
      <p className="m-0 text-[13px] text-mute">{longDay(`${from}T12:00:00+05:30`)} to {longDay(`${shift(from, DAYS - 1)}T12:00:00+05:30`)}</p>
      {days.length ? (
        days.map((d) => {
          const list = jobs.filter((j) => istDate(new Date(j.starts_at!)) === d);
          return (
            <Panel key={d} title={longDay(`${d}T12:00:00+05:30`)} icon={CalendarDays} aside={`${list.length} ${list.length === 1 ? "shoot" : "shoots"}`}>
              <DataTable label={`Shoots on ${longDay(`${d}T12:00:00+05:30`)}`} minWidth={640} columns={[{ label: "Time" }, { label: "Client" }, { label: "Job" }, { label: "Reelmaker" }, { label: "Status" }]}>
                {list.map((j) => {
                  const rm = liveAssignment(j)?.full_name;
                  return (
                    <Row key={j.id} href={`/jobs/${j.id}`}>
                      <Cell className="font-mono text-[13px] whitespace-nowrap">{window_(j.starts_at, j.duration_minutes)}</Cell>
                      <Cell><div className="font-semibold">{j.client_name}</div><div className="text-xs text-mute">{j.city}</div></Cell>
                      <Cell className="font-mono text-[13px] text-mute">{j.code}</Cell>
                      <Cell className={rm ? "" : "font-semibold text-bad"}>{rm ?? "Unassigned"}</Cell>
                      <Cell>{rm ? <StatusChip status={j.status} /> : <Chip tone="bad">Needs reelmaker</Chip>}</Cell>
                    </Row>
                  );
                })}
              </DataTable>
            </Panel>
          );
        })
      ) : (
        <Panel><Empty icon={CalendarDays}>Nothing booked in these two weeks.</Empty></Panel>
      )}
    </>
  );
}
