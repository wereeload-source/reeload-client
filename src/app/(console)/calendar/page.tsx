import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip, StatusChip, Empty } from "@/components/ui";
import { day, time } from "@/lib/format";
import { JOB_SELECT, liveAssignment, type Job } from "@/lib/types";

// Week list for every role. The day timeline (one lane per reelmaker) from the mockup is week 7 of the build plan.
export default async function CalendarPage() {
  const { supabase } = await requireProfile();
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 14 * 86_400_000);
  const { data } = await supabase.from("jobs").select(JOB_SELECT)
    .gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString())
    .not("status", "in", "(cancelled,lead,draft)").order("starts_at");
  const jobs = (data ?? []) as Job[];
  const days = [...new Set(jobs.map((j) => day(j.starts_at)))];
  return (
    <>
      <PageBar title="Calendar" />
      <Pane>
        {days.length ? days.map((d) => (
          <div key={d} className="card">
            <h3>{d}</h3>
            {jobs.filter((j) => day(j.starts_at) === d).map((j) => {
              const rm = liveAssignment(j)?.profiles?.full_name;
              return (
                <div key={j.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="w-24 flex-none font-mono text-[13px]">{time(j.starts_at)} · {(j.duration_minutes ?? 0) / 60}h</span>
                  <div className="flex-1"><b>{j.clients?.name}</b> <span className="text-mute">{j.city}</span></div>
                  <StatusChip status={j.status} />
                  {rm ? <Avatar name={rm} /> : <Chip tone="rec">Unassigned</Chip>}
                </div>
              );
            })}
          </div>
        )) : <div className="card"><Empty>Nothing booked in the next two weeks.</Empty></div>}
      </Pane>
    </>
  );
}
