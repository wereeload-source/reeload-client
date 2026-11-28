import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip, Empty, Panel, StatusChip } from "@/components/ui";
import { hours, istDate, longDay, time } from "@/lib/format";
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
        <LinkButton href={`/calendar?from=${shift(from, -DAYS)}`} variant="secondary" size="sm"><ChevronLeft aria-hidden className="size-4" /> Earlier</LinkButton>
        <LinkButton href="/calendar" variant="secondary" size="sm">Today</LinkButton>
        <LinkButton href={`/calendar?from=${shift(from, DAYS)}`} variant="secondary" size="sm">Later <ChevronRight aria-hidden className="size-4" /></LinkButton>
      </PageBar>
      <Pane>
        <p className="text-[13px] text-mute">{longDay(`${from}T12:00:00+05:30`)} to {longDay(`${shift(from, DAYS - 1)}T12:00:00+05:30`)}</p>
        {days.length ? days.map((d) => (
          <Panel key={d} title={longDay(`${d}T12:00:00+05:30`)} icon={CalendarDays}>
            {jobs.filter((j) => istDate(new Date(j.starts_at!)) === d).map((j) => {
              const rm = liveAssignment(j)?.full_name;
              return (
                <a key={j.id} href={`/jobs/${j.id}`} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 hover:bg-sub">
                  <span className="w-24 flex-none font-mono text-[13px]">{time(j.starts_at)} · {hours(j.duration_minutes)}</span>
                  <div className="flex-1"><b>{j.client_name}</b> <span className="text-mute">{j.city} · {j.code}</span></div>
                  <StatusChip status={j.status} />
                  {rm ? <span className="flex items-center gap-1.5"><Avatar name={rm} /><span className="hidden text-sm md:inline">{rm}</span></span> : <Chip tone="rec">Unassigned</Chip>}
                </a>
              );
            })}
          </Panel>
        )) : <Panel><Empty icon={CalendarDays}>Nothing booked in these two weeks.</Empty></Panel>}
      </Pane>
    </>
  );
}
