import { AlarmClock, ClipboardCheck, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { PageBar, Pane } from "@/components/page-bar";
import { Chip, Empty, Panel, StatusChip } from "@/components/ui";
import { day, time } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import type { CheckinPending, ExtraTimeRow, ReviewRow } from "@/lib/types";
import { DecideExtraTime } from "@/components/decide-extra-time";

export default async function ReviewPage() {
  const { me } = await requirePage("review");
  const [rows, checkins, extra] = await Promise.all([
    api.get<ReviewRow[]>("/review"),
    api.get<CheckinPending[]>("/checkins/pending"),
    api.get<ExtraTimeRow[]>("/extra-time?decision=pending"),
  ]);

  return (
    <>
      <PageBar title="Review & delivery" />
      <Pane>
        {checkins.length > 0 && (
          <Panel title="Waiting for a check-in code" icon={ShieldCheck} flush>
            <table className="tbl">
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.checkin_id}>
                    <td><Link className="font-semibold text-rec hover:underline" href={`/jobs/${c.job_id}`}>{c.code}</Link></td>
                    <td>{c.reelmaker}<div className="text-[13px] text-mute">{c.city} · asked {time(c.requested_at)} · {c.otp_sends} codes sent</div></td>
                    <td className="num">{c.release_in_seconds > 0 ? <span className="text-mute">Ops can release in {Math.ceil(c.release_in_seconds / 60)} min</span> : <Chip tone="warn">Ops can release now</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        <Panel title="Shoots with work to check" icon={ClipboardCheck} flush>
          {rows.length ? (
            <table className="tbl">
              <thead><tr><th>Job</th><th>Shot</th><th>Reelmaker</th><th>Status</th><th className="num">Raw</th><th className="num">Edited</th><th>Due</th></tr></thead>
              <tbody>
                {rows.map((j) => (
                  <tr key={j.id}>
                    <td><Link className="font-semibold hover:underline" href={`/jobs/${j.id}`}>{j.client_name}</Link><div className="text-[13px] text-mute">{j.code} · {j.city}</div></td>
                    <td>{day(j.starts_at)}</td>
                    <td>{j.reelmaker ?? <span className="text-mute">—</span>}</td>
                    <td><StatusChip status={j.status} /></td>
                    <td className="num">{j.raw_files}</td>
                    <td className="num">{j.edited_files}</td>
                    <td className="whitespace-nowrap">
                      {j.raw_overdue || j.edited_overdue ? (
                        <span className="flex items-center gap-1 text-[13px] font-semibold text-rec"><AlarmClock aria-hidden className="size-3.5" />{j.raw_overdue ? "Raw overdue" : "Edited overdue"}</span>
                      ) : (
                        <span className="text-[13px] text-mute">{j.raw_files ? `Edited by ${day(j.edited_due)}` : `Raw by ${day(j.raw_due)} ${time(j.raw_due)}`}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={ClipboardCheck}>No work waiting for review.</Empty>}
        </Panel>

        {extra.length > 0 && (
          <Panel title="Extra time waiting for Sales" icon={Timer} flush>
            <table className="tbl">
              <tbody>
                {extra.map((e) => (
                  <tr key={e.id}>
                    <td><Link className="hover:underline" href={`/jobs/${e.job_id}`}>{e.code}</Link> · {e.client_name}</td>
                    <td>{e.minutes} min{e.note ? ` · ${e.note}` : ""}</td>
                    <td className="text-mute">by {e.added_by_name}</td>
                    <td className="num">{me.role === "admin" && <DecideExtraTime id={e.id} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </Pane>
    </>
  );
}
