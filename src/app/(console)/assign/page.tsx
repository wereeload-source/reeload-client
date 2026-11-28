import { CalendarOff, Hourglass } from "lucide-react";
import { Cell, DataTable, Row } from "@/components/data-table";
import { PageBar } from "@/components/page-bar";
import { Panel } from "@/components/ui";
import { day, dayTime } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import type { AssignQueue, LeaveRow, Reelmaker } from "@/lib/types";
import { AssignBoard } from "./board";
import { AddLeave, RemoveLeave } from "./leave";

export default async function AssignPage() {
  await requirePage("assign");
  const [queue, reelmakers, leave] = await Promise.all([
    api.get<AssignQueue>("/assign/queue"),
    api.get<Reelmaker[]>("/reelmakers"),
    api.get<LeaveRow[]>("/leave"),
  ]);
  const nameOf = (id: string) => reelmakers.find((r) => r.id === id)?.full_name ?? "Reelmaker";

  return (
    <>
      <PageBar title="Unassigned jobs" note="Prices are hidden for Operations. Overlapping bookings are refused by the system.">
        <AddLeave reelmakers={reelmakers} />
      </PageBar>

      <AssignBoard jobs={queue.unassigned} />

      <div className="flex flex-wrap gap-4">
        <Panel title="Waiting for the reelmaker to reply" icon={Hourglass} className="flex-[1_1_420px]">
          <DataTable
            label="Waiting for a reply"
            minWidth={420}
            isEmpty={!queue.awaiting_reply.length}
            empty="No one to chase."
            columns={[{ label: "Job" }, { label: "Client" }, { label: "When" }, { label: "Reelmaker" }]}
          >
            {queue.awaiting_reply.map((w) => (
              <Row key={w.assignment_id} href={`/jobs/${w.id}`}>
                <Cell className="font-mono text-[13px] whitespace-nowrap text-mute">{w.code}</Cell>
                <Cell className="font-semibold">{w.client_name}</Cell>
                <Cell className="whitespace-nowrap">{dayTime(w.starts_at)}</Cell>
                <Cell>{w.reelmaker}</Cell>
              </Row>
            ))}
          </DataTable>
        </Panel>
        <Panel title="Upcoming leave" icon={CalendarOff} className="flex-[1_1_420px]">
          <DataTable
            label="Upcoming leave"
            minWidth={420}
            isEmpty={!leave.length}
            empty="No leave booked."
            columns={[{ label: "Reelmaker" }, { label: "Days" }, { label: "Note" }, { label: "Remove", hidden: true, align: "end" }]}
          >
            {leave.map((l) => (
              <Row key={l.id}>
                <Cell className="font-medium">{l.reelmaker_name ?? nameOf(l.reelmaker_id)}</Cell>
                <Cell className="whitespace-nowrap">{day(l.starts_at)} – {day(new Date(new Date(l.ends_at).getTime() - 1).toISOString())}</Cell>
                <Cell className="text-mute">{l.note}</Cell>
                <Cell className="text-right"><RemoveLeave id={l.id} /></Cell>
              </Row>
            ))}
          </DataTable>
        </Panel>
      </div>
    </>
  );
}
