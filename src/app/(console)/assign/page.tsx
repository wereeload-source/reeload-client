import { CalendarOff, Hourglass } from "lucide-react";
import { PageBar, Pane } from "@/components/page-bar";
import { Chip, Empty, Panel } from "@/components/ui";
import { day, time } from "@/lib/format";
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
      <PageBar title="Assign shoots">
        {queue.flagged > 0 && <Chip tone="rec">{queue.flagged} starting soon</Chip>}
        <AddLeave reelmakers={reelmakers} />
      </PageBar>
      <Pane>
        <AssignBoard jobs={queue.unassigned} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Waiting for the reelmaker to reply" icon={Hourglass} flush>
            {queue.awaiting_reply.length ? (
              <table className="tbl">
                <tbody>
                  {queue.awaiting_reply.map((w) => (
                    <tr key={w.assignment_id}>
                      <td className="text-mute">{w.code}</td>
                      <td><b>{w.client_name}</b><div className="text-[13px] text-mute">{day(w.starts_at)} · {time(w.starts_at)}</div></td>
                      <td>{w.reelmaker}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty>No one to chase.</Empty>}
          </Panel>
          <Panel title="Upcoming leave" icon={CalendarOff} flush>
            {leave.length ? (
              <table className="tbl">
                <tbody>
                  {leave.map((l) => (
                    <tr key={l.id}>
                      <td>{l.reelmaker_name ?? nameOf(l.reelmaker_id)}</td>
                      <td>{day(l.starts_at)} – {day(new Date(new Date(l.ends_at).getTime() - 1).toISOString())}</td>
                      <td className="text-mute">{l.note}</td>
                      <td className="num"><RemoveLeave id={l.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty>No leave booked.</Empty>}
          </Panel>
        </div>
      </Pane>
    </>
  );
}
