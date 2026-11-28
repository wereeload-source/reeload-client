import { ClipboardCheck, ShieldCheck, Timer } from "lucide-react";
import { Cell, DataTable, Row } from "@/components/data-table";
import { DecideExtraTime } from "@/components/decide-extra-time";
import { PageBar } from "@/components/page-bar";
import { Chip, Panel, StatusChip } from "@/components/ui";
import { day, time } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import type { CheckinPending, ExtraTimeRow, ReviewRow } from "@/lib/types";

export default async function ReviewPage() {
  const { me } = await requirePage("review");
  const [rows, checkins, extra] = await Promise.all([
    api.get<ReviewRow[]>("/review"),
    api.get<CheckinPending[]>("/checkins/pending"),
    api.get<ExtraTimeRow[]>("/extra-time?decision=pending"),
  ]);

  return (
    <>
      <PageBar title="Review files" note="Raw files are due 2 hours after the shoot, edited reels the next day." />

      {checkins.length > 0 && (
        <Panel title="Waiting for a check-in code" icon={ShieldCheck}>
          <DataTable label="Check-ins waiting" minWidth={560} columns={[{ label: "Job" }, { label: "Reelmaker" }, { label: "Asked at" }, { label: "Release", align: "end" }]}>
            {checkins.map((c) => (
              <Row key={c.checkin_id} href={`/jobs/${c.job_id}`}>
                <Cell className="font-mono text-[13px] font-medium text-rec">{c.code}</Cell>
                <Cell>
                  <div className="font-semibold">{c.reelmaker}</div>
                  <div className="text-xs text-mute">{c.city} · {c.otp_sends} {c.otp_sends === 1 ? "code" : "codes"} sent</div>
                </Cell>
                <Cell className="font-mono text-[13px]">{time(c.requested_at)}</Cell>
                <Cell className="text-right">
                  {c.release_in_seconds > 0 ? (
                    <span className="text-[13px] text-mute">Operations can release in {Math.ceil(c.release_in_seconds / 60)} min</span>
                  ) : (
                    <Chip tone="warn">Operations can release now</Chip>
                  )}
                </Cell>
              </Row>
            ))}
          </DataTable>
        </Panel>
      )}

      <Panel title="Shoots with work to check" icon={ClipboardCheck}>
        <DataTable
          label="Shoots with work to check"
          minWidth={760}
          isEmpty={!rows.length}
          empty="No work waiting for review."
          columns={[{ label: "Client" }, { label: "Shot" }, { label: "Reelmaker" }, { label: "Status" }, { label: "Raw", align: "end" }, { label: "Edited", align: "end" }, { label: "Due" }]}
        >
          {rows.map((j) => (
            <Row key={j.id} href={`/jobs/${j.id}`}>
              <Cell>
                <div className="font-semibold">{j.client_name}</div>
                <div className="font-mono text-xs text-mute">{j.code} · {j.city}</div>
              </Cell>
              <Cell className="font-mono text-[13px]">{day(j.starts_at)}</Cell>
              <Cell>{j.reelmaker ?? <span className="text-mute">—</span>}</Cell>
              <Cell><StatusChip status={j.status} /></Cell>
              <Cell className="text-right font-mono">{j.raw_files}</Cell>
              <Cell className="text-right font-mono">{j.edited_files}</Cell>
              <Cell className="whitespace-nowrap">
                {j.raw_overdue || j.edited_overdue ? (
                  <Chip tone="bad">{j.raw_overdue ? "Raw overdue" : "Edited overdue"}</Chip>
                ) : (
                  <span className="text-[13px] text-mute">{j.raw_files ? `Edited by ${day(j.edited_due)}` : `Raw by ${day(j.raw_due)} ${time(j.raw_due)}`}</span>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Panel>

      {extra.length > 0 && (
        <Panel title="Extra time waiting for a decision" icon={Timer}>
          <DataTable label="Extra time" minWidth={620} columns={[{ label: "Job" }, { label: "Time" }, { label: "Added by" }, { label: "Decision", align: "end", hidden: me.role !== "admin" }]}>
            {extra.map((e) => (
              <Row key={e.id}>
                <Cell><span className="font-mono text-[13px]">{e.code}</span> · {e.client_name}</Cell>
                <Cell>{e.minutes} min{e.note ? ` · ${e.note}` : ""}</Cell>
                <Cell className="text-mute">{e.added_by_name}</Cell>
                <Cell className="text-right">{me.role === "admin" && <DecideExtraTime id={e.id} />}</Cell>
              </Row>
            ))}
          </DataTable>
        </Panel>
      )}
    </>
  );
}
