import { Card, Link } from "@heroui/react";
import { FileVideo, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Cell, DataTable, Row } from "@/components/data-table";
import { PageBar } from "@/components/page-bar";
import { Chip, Facts, Panel, StatusChip } from "@/components/ui";
import { day, fileSize, hours, inr, longDay, num, time, window_ } from "@/lib/format";
import { ApiError, api, requirePage } from "@/lib/session";
import { METHOD_LABEL, liveAssignment, type Job, type JobPayments, type Setting, type ShareLink, type UploadRow } from "@/lib/types";
import {
  AddExtraTime, ConfirmJob, CreateShareLink, DownloadFile, RecordAdvance, ReleaseCheckin, ReleaseWork, RequestPriceChange,
  Reschedule, RevokeLink, SendBack,
} from "./job-actions";

type CheckinInfo = { verified_at: string | null; completed_at: string | null; method: string | null; release_in_seconds?: number; requested_at: string } | null;

/** Optional sections: a role that may not see one simply does not get it. */
const optional = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me } = await requirePage("jobs");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const job = await api.get<Job>(`/jobs/${id}`).catch((e) => {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  });

  const sales = me.role === "admin" || me.role === "sales";
  const staff = me.role === "admin" || me.role === "ops";
  const [money, uploads, links, checkin, settings] = await Promise.all([
    sales ? optional(api.get<JobPayments>(`/jobs/${id}/payments`)) : null,
    staff ? optional(api.get<UploadRow[]>(`/jobs/${id}/uploads`)) : null,
    staff ? optional(api.get<ShareLink[]>(`/jobs/${id}/share-links`)) : null,
    staff ? optional(api.get<CheckinInfo>(`/jobs/${id}/checkin`)) : null,
    staff ? optional(api.get<Setting[]>("/settings")) : null,
  ]);
  const rm = liveAssignment(job);
  const s = job.status;
  const canLink = staff && (["paid", "delivered"].includes(s) || (me.role === "admin" && s === "released"));
  const allowRaw = settings?.find((x) => x.key === "share_include_raw")?.value === true;
  const files = (uploads ?? []).filter((u) => u.kind !== "proof" && u.status === "complete");
  const balance = money ? num(money.summary.balance) : 0;

  const actions = [
    sales && ["lead", "draft"].includes(s) && <RecordAdvance key="adv" jobId={id} />,
    sales && ["lead", "draft"].includes(s) && <ConfirmJob key="confirm" jobId={id} />,
    (sales || staff) && ["draft", "confirmed", "assigned", "accepted"].includes(s) && <Reschedule key="move" jobId={id} />,
    sales && !["cancelled", "closed"].includes(s) && <RequestPriceChange key="price" jobId={id} />,
    staff && s === "uploaded" && <ReleaseWork key="release" jobId={id} />,
    staff && s === "uploaded" && <SendBack key="back" jobId={id} />,
    staff && ["accepted", "reached", "uploaded", "released"].includes(s) && <AddExtraTime key="extra" jobId={id} />,
    staff && checkin && !checkin.verified_at && s === "accepted" && <ReleaseCheckin key="checkin" jobId={id} waitSeconds={checkin.release_in_seconds ?? 0} />,
    canLink && <CreateShareLink key="link" jobId={id} allowRaw={allowRaw} />,
  ].filter(Boolean);

  return (
    <>
      <PageBar eyebrow={<Link href="/jobs" className="text-[13px] font-medium text-mute no-underline hover:text-ink">Jobs / {job.code}</Link>} title={job.client_name}>
        <StatusChip status={s} />
      </PageBar>

      {actions.length > 0 && <div className="flex flex-wrap gap-2">{actions}</div>}

      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
          <Card className="gap-3.5 px-6 py-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-[22px] font-semibold">Shoot</h2>
              <span className="font-mono text-sm text-mute">{job.code}</span>
            </div>
            <Facts
              items={[
                { label: "When", value: job.starts_at ? `${longDay(job.starts_at)} · ${window_(job.starts_at, job.duration_minutes)} (${hours(job.duration_minutes)})` : "Not set" },
                {
                  label: "Where",
                  value: (
                    <>
                      {job.address ? `${job.address}, ${job.city}` : job.city}
                      {job.maps_url && (
                        <>
                          {" · "}
                          <Link href={job.maps_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-info">Open map</Link>
                        </>
                      )}
                    </>
                  ),
                },
                { label: "Client", value: <>{job.client_name} · <span className="font-mono">{job.client_phone}</span></> },
                { label: "On-site contact", value: job.onsite_contact_name ? <>{job.onsite_contact_name} · <span className="font-mono">{job.onsite_contact_phone}</span></> : "Not given" },
                {
                  label: "Reelmaker",
                  value: rm ? (
                    <span className="flex flex-wrap items-center gap-2">{rm.full_name} <Chip tone={rm.status === "accepted" ? "ok" : "warn"}>{rm.status === "accepted" ? "Accepted" : "Awaiting accept"}</Chip></span>
                  ) : (
                    <span className="font-semibold text-bad">Unassigned</span>
                  ),
                },
                ...(checkin
                  ? [{
                      label: "Check-in",
                      value: `${checkin.completed_at ? `Done at ${time(checkin.completed_at)}` : checkin.verified_at ? "Code verified, photos pending" : "Waiting for the code"}${checkin.method === "ops_release" ? " (released by Operations)" : ""}`,
                    }]
                  : []),
              ]}
            />
            {job.brief && (
              <div className="rounded-[10px] bg-sub px-3.5 py-3 text-sm leading-normal whitespace-pre-line">
                <strong>Brief.</strong> {job.brief}
              </div>
            )}
            <div className={`text-[13px] font-medium ${job.consent ? "text-ok" : "text-bad"}`}>
              {job.consent ? "Client has agreed to footage and location recording." : "Client consent is not recorded yet."}
            </div>
          </Card>

          {uploads && (
            <Panel title="Files" icon={FileVideo}>
              <DataTable
                label="Files"
                minWidth={560}
                isEmpty={!files.length}
                empty="No files uploaded yet."
                columns={[{ label: "File" }, { label: "Kind" }, { label: "By" }, { label: "Size", align: "end" }, { label: "Download", hidden: true, align: "end" }]}
              >
                {files.map((f) => (
                  <Row key={f.id}>
                    <Cell className="max-w-80 truncate font-mono text-[13px]">{f.file_name}</Cell>
                    <Cell><Chip tone={f.kind === "edited" ? "ok" : "neutral"}>{f.kind === "edited" ? "Edited" : "Raw"}</Chip></Cell>
                    <Cell>{f.uploaded_by_name}{f.on_behalf_of_name && <span className="text-mute"> for {f.on_behalf_of_name}</span>}</Cell>
                    <Cell className="text-right font-mono">{fileSize(f.size_bytes)}</Cell>
                    <Cell className="text-right"><DownloadFile id={f.id} /></Cell>
                  </Row>
                ))}
              </DataTable>
            </Panel>
          )}

          {links && links.length > 0 && (
            <Panel title="Client download links" icon={Link2}>
              <DataTable
                label="Client download links"
                minWidth={560}
                columns={[{ label: "Created" }, { label: "By" }, { label: "Expires" }, { label: "Raw files" }, { label: "State" }, { label: "Revoke", hidden: true, align: "end" }]}
              >
                {links.map((l) => (
                  <Row key={l.id}>
                    <Cell className="font-mono text-[13px]">{day(l.created_at)}</Cell>
                    <Cell>{l.created_by_name}</Cell>
                    <Cell className="font-mono text-[13px]">{day(l.expires_at)}</Cell>
                    <Cell>{l.include_raw ? "Yes" : "No"}</Cell>
                    <Cell><Chip tone={l.state === "active" ? "ok" : l.state === "revoked" ? "bad" : "neutral"}>{l.state === "active" ? "Active" : l.state === "revoked" ? "Revoked" : "Expired"}</Chip></Cell>
                    <Cell className="text-right">{l.state === "active" && <RevokeLink id={l.id} />}</Cell>
                  </Row>
                ))}
              </DataTable>
            </Panel>
          )}
        </section>

        {money && (
          <aside className="flex max-w-[400px] min-w-[280px] flex-[1_1_320px] flex-col gap-4">
            <Card className="gap-4 p-[22px]">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-lg font-semibold">Money</h2>
                {balance <= 0 ? <Chip tone="ok">Paid</Chip> : <Chip tone="warn">Balance due</Chip>}
              </div>
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 text-sm">
                <dt className="text-mute">Agreed</dt>
                <dd className="m-0 font-mono">{inr(money.summary.agreed_amount)}</dd>
                <dt className="text-mute">Approved changes</dt>
                <dd className="m-0 font-mono">{inr(money.summary.approved_changes ?? 0)}</dd>
                <dt className="text-mute">Received</dt>
                <dd className="m-0 font-mono text-ok">{inr(money.summary.received)}</dd>
                <dt className="border-t border-line2 pt-2.5 font-semibold">Balance due</dt>
                <dd className="m-0 border-t border-line2 pt-2.5 font-mono font-semibold">{inr(Math.max(balance, 0))}</dd>
              </dl>
              {money.payments.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-2 border-t border-line2 p-0 pt-3 text-[13px]">
                  {money.payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span><span className="font-mono">{day(p.received_at)}</span> · {METHOD_LABEL[p.method]}{p.is_advance ? " · advance" : ""}</span>
                      <span className="font-mono">{inr(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <p className="m-0 px-1 text-xs leading-normal text-mute">Price changes need admin approval and are written to the audit log. Operations never sees these amounts.</p>
          </aside>
        )}
      </div>
    </>
  );
}
