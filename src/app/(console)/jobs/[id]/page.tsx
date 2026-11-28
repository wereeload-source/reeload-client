import { ArrowLeft, FileVideo, IndianRupee, Link2, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBar, Pane } from "@/components/page-bar";
import { Chip, Empty, Panel, StatusChip } from "@/components/ui";
import { day, fileSize, hours, inr, longDay, num, time } from "@/lib/format";
import { ApiError, api, requirePage } from "@/lib/session";
import {
  METHOD_LABEL, liveAssignment, type Job, type LedgerRow, type PaymentMethod, type Setting, type ShareLink, type UploadRow,
} from "@/lib/types";
import {
  AddExtraTime, ConfirmJob, CreateShareLink, DownloadFile, RecordAdvance, ReleaseCheckin, ReleaseWork, RequestPriceChange,
  Reschedule, RevokeLink, SendBack,
} from "./job-actions";

type Payments = {
  summary: LedgerRow;
  payments: { id: string; amount: string; method: PaymentMethod; reference: string | null; is_advance: boolean; received_at: string; recorded_by_name: string | null }[];
};
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
    sales ? optional(api.get<Payments>(`/jobs/${id}/payments`)) : null,
    staff ? optional(api.get<UploadRow[]>(`/jobs/${id}/uploads`)) : null,
    staff ? optional(api.get<ShareLink[]>(`/jobs/${id}/share-links`)) : null,
    staff ? optional(api.get<CheckinInfo>(`/jobs/${id}/checkin`)) : null,
    staff ? optional(api.get<Setting[]>("/settings")) : null,
  ]);
  const rm = liveAssignment(job);
  const s = job.status;
  const ends = job.starts_at && job.duration_minutes ? new Date(new Date(job.starts_at).getTime() + job.duration_minutes * 60_000).toISOString() : null;
  const canLink = staff && (["paid", "delivered"].includes(s) || (me.role === "admin" && s === "released"));
  const allowRaw = settings?.find((x) => x.key === "share_include_raw")?.value === true;
  const files = (uploads ?? []).filter((u) => u.kind !== "proof" && u.status === "complete");

  return (
    <>
      <PageBar title={`${job.code} · ${job.client_name}`}>
        <StatusChip status={s} />
      </PageBar>
      <Pane>
        <Link href="/jobs" className="flex w-fit items-center gap-1 text-[13px] text-mute hover:text-ink">
          <ArrowLeft aria-hidden className="size-3.5" /> All jobs
        </Link>

        <div className="flex flex-wrap gap-2">
          {sales && ["lead", "draft"].includes(s) && <><RecordAdvance jobId={id} /><ConfirmJob jobId={id} /></>}
          {(sales || staff) && ["draft", "confirmed", "assigned", "accepted"].includes(s) && <Reschedule jobId={id} />}
          {sales && !["cancelled", "closed"].includes(s) && <RequestPriceChange jobId={id} />}
          {staff && s === "uploaded" && <><ReleaseWork jobId={id} /><SendBack jobId={id} /></>}
          {staff && ["accepted", "reached", "uploaded", "released"].includes(s) && <AddExtraTime jobId={id} />}
          {staff && checkin && !checkin.verified_at && s === "accepted" && <ReleaseCheckin jobId={id} waitSeconds={checkin.release_in_seconds ?? 0} />}
          {canLink && <CreateShareLink jobId={id} allowRaw={allowRaw} />}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Shoot" icon={MapPin}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-mute">When</dt>
              <dd>{job.starts_at ? `${longDay(job.starts_at)}, ${time(job.starts_at)} – ${time(ends)} (${hours(job.duration_minutes)})` : "Not set"}</dd>
              <dt className="text-mute">Where</dt>
              <dd>{job.address ? `${job.address}, ${job.city}` : job.city}{job.maps_url && <> · <a className="text-rec hover:underline" href={job.maps_url} target="_blank" rel="noopener noreferrer">Map</a></>}</dd>
              <dt className="text-mute">Client</dt><dd>{job.client_name} · <span className="font-mono">{job.client_phone}</span></dd>
              {job.onsite_contact_name && <><dt className="text-mute">On site</dt><dd>{job.onsite_contact_name} · <span className="font-mono">{job.onsite_contact_phone}</span></dd></>}
              <dt className="text-mute">Reelmaker</dt><dd>{rm ? <>{rm.full_name} <Chip tone={rm.status === "accepted" ? "ok" : "warn"}>{rm.status === "accepted" ? "Accepted" : "Asked"}</Chip></> : <span className="text-mute">Not assigned</span>}</dd>
              <dt className="text-mute">Consent</dt><dd>{job.consent ? "Given" : <span className="text-rec">Not recorded</span>}</dd>
              {checkin && <><dt className="text-mute">Check-in</dt><dd>{checkin.completed_at ? `Done ${time(checkin.completed_at)}` : checkin.verified_at ? "Code verified, photos pending" : "Waiting for the code"}{checkin.method === "ops_release" && " (released by Ops)"}</dd></>}
            </dl>
            {job.brief && <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm">{job.brief}</p>}
          </Panel>

          {money && (
            <Panel title="Money" icon={IndianRupee}>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
                <dt className="text-mute">Agreed</dt><dd className="num">{inr(money.summary.agreed_amount)}</dd>
                <dt className="text-mute">Approved changes</dt><dd className="num">{inr(money.summary.approved_changes)}</dd>
                <dt className="text-mute">Received</dt><dd className="num">{inr(money.summary.received)}</dd>
                <dt className="font-semibold">Balance</dt><dd className={`num font-bold ${num(money.summary.balance) <= 0 ? "text-ok" : ""}`}>{num(money.summary.balance) <= 0 ? "Paid" : inr(money.summary.balance)}</dd>
              </dl>
              {money.payments.length > 0 && (
                <table className="tbl mt-3">
                  <tbody>
                    {money.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{day(p.received_at)}</td>
                        <td>{METHOD_LABEL[p.method]}{p.is_advance && <span className="text-mute"> · advance</span>}</td>
                        <td className="num">{inr(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          )}
        </div>

        {uploads && (
          <Panel title="Files" icon={FileVideo} flush>
            {files.length ? (
              <table className="tbl">
                <thead><tr><th>File</th><th>Kind</th><th>By</th><th className="num">Size</th><th /></tr></thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id}>
                      <td className="max-w-80 truncate">{f.file_name}</td>
                      <td><Chip tone={f.kind === "edited" ? "ok" : undefined}>{f.kind}</Chip></td>
                      <td>{f.uploaded_by_name}{f.on_behalf_of_name && <span className="text-mute"> for {f.on_behalf_of_name}</span>}</td>
                      <td className="num">{fileSize(f.size_bytes)}</td>
                      <td className="num"><DownloadFile id={f.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty>No files uploaded yet.</Empty>}
          </Panel>
        )}

        {links && links.length > 0 && (
          <Panel title="Client download links" icon={Link2} flush>
            <table className="tbl">
              <thead><tr><th>Created</th><th>By</th><th>Expires</th><th>Raw</th><th>State</th><th /></tr></thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id}>
                    <td>{day(l.created_at)}</td><td>{l.created_by_name}</td><td>{day(l.expires_at)}</td><td>{l.include_raw ? "Yes" : "No"}</td>
                    <td><Chip tone={l.state === "active" ? "ok" : l.state === "revoked" ? "rec" : undefined}>{l.state}</Chip></td>
                    <td className="num">{l.state === "active" && <RevokeLink id={l.id} />}</td>
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
