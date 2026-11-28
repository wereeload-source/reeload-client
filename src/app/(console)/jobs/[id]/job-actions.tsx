"use client";
import { toast } from "@heroui/react";
import {
  CalendarClock, CheckCircle2, Clock4, Download, Link2, Link2Off, PackageCheck, ShieldCheck, TrendingUp, Undo2, Wallet,
} from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { CheckInput, SelectInput, TextAreaInput, TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";
import { istInstant } from "@/lib/format";

const METHODS = [{ id: "upi", label: "UPI" }, { id: "bank_transfer", label: "Bank transfer" }, { id: "cash", label: "Cash" }];
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const amount = (f: FormData, k: string) => Number(text(f, k).replace(/[,₹\s]/g, ""));
const path = (id: string) => `/jobs/${encodeURIComponent(id)}`;

export function RecordAdvance({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="Record advance" icon={Wallet} variant="secondary" title="Record the advance" success="Advance recorded"
      onSubmit={(f) => apiClient.post(`${path(jobId)}/advance`, { amount: amount(f, "amount"), method: text(f, "method") || "upi", reference: text(f, "reference") || null })}>
      <TextInput name="amount" label="Amount (₹)" inputMode="numeric" isRequired />
      <SelectInput name="method" label="Method" options={METHODS} defaultValue="upi" />
      <TextInput name="reference" label="Reference" maxLength={120} />
    </FormDialog>
  );
}

export function ConfirmJob({ jobId }: { jobId: string }) {
  return (
    <ActionButton icon={CheckCircle2} variant="primary" size="md" success="Job confirmed" run={() => apiClient.post(`${path(jobId)}/confirm`)}>
      Confirm job
    </ActionButton>
  );
}

export function Reschedule({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="Reschedule" icon={CalendarClock} variant="secondary" title="Move the shoot"
      description="If the reelmaker is not free at the new time, the shoot goes back to Operations." success="Shoot moved"
      onSubmit={(f) => {
        const startsAt = istInstant(text(f, "date"), text(f, "time"));
        if (!startsAt) throw new Error("Pick a date and a start time");
        const hours = Number(text(f, "hours"));
        return apiClient.post(`${path(jobId)}/reschedule`, {
          starts_at: startsAt, ...(hours > 0 ? { duration_minutes: Math.round(hours * 60) } : {}), reason: text(f, "reason") || null,
        });
      }}>
      <div className="grid grid-cols-2 gap-3">
        <TextInput name="date" label="Date" type="date" isRequired />
        <TextInput name="time" label="Start (IST)" type="time" isRequired />
        <TextInput name="hours" label="Duration (hours)" type="number" step="0.5" min="0.5" max="24" />
      </div>
      <TextInput name="reason" label="Reason" maxLength={300} />
    </FormDialog>
  );
}

export function RequestPriceChange({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="Change price" icon={TrendingUp} variant="secondary" title="Request a price change"
      description="Admin approves every change before it counts." success="Sent to Admin for approval"
      onSubmit={(f) => apiClient.post(`${path(jobId)}/price-changes`, { delta: amount(f, "delta"), reason: text(f, "reason") })}>
      <TextInput name="delta" label="Change (₹)" description="Use a minus sign to lower the price, e.g. -500." isRequired />
      <TextInput name="reason" label="Reason" isRequired minLength={3} maxLength={300} />
    </FormDialog>
  );
}

export function ReleaseWork({ jobId }: { jobId: string }) {
  return (
    <ActionButton icon={PackageCheck} variant="primary" size="md" success="Work released"
      confirm="Release this work? If nothing is owed the job becomes Paid." run={() => apiClient.post(`${path(jobId)}/release`)}>
      Release work
    </ActionButton>
  );
}

export function SendBack({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="Send back" icon={Undo2} variant="danger-soft" title="Send the work back" success="Sent back to the reelmaker"
      onSubmit={(f) => apiClient.post(`${path(jobId)}/send-back`, { note: text(f, "note") })}>
      <TextAreaInput name="note" label="What needs fixing" isRequired maxLength={500} />
    </FormDialog>
  );
}

export function AddExtraTime({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="Extra time" icon={Clock4} variant="secondary" title="Add extra time"
      description="Sales decides whether the client is charged." success="Extra time added"
      onSubmit={(f) => apiClient.post(`${path(jobId)}/extra-time`, { minutes: Math.round(amount(f, "minutes")), note: text(f, "note") || null })}>
      <TextInput name="minutes" label="Minutes" type="number" min="1" max="1440" isRequired />
      <TextInput name="note" label="Note" maxLength={300} />
    </FormDialog>
  );
}

export function ReleaseCheckin({ jobId, waitSeconds }: { jobId: string; waitSeconds: number }) {
  return (
    <FormDialog trigger={waitSeconds > 0 ? `Release in ${Math.ceil(waitSeconds / 60)} min` : "Release check-in"} icon={ShieldCheck}
      variant="secondary" isDisabled={waitSeconds > 0} title="Approve check-in without the code"
      description="Only after the client could not be reached. Your name and reason are recorded." success="Check-in released"
      onSubmit={(f) => apiClient.post(`${path(jobId)}/checkin/release`, { reason: text(f, "reason") })}>
      <TextAreaInput name="reason" label="Reason" isRequired maxLength={300} />
    </FormDialog>
  );
}

export function CreateShareLink({ jobId, allowRaw }: { jobId: string; allowRaw: boolean }) {
  return (
    <FormDialog trigger="Create download link" icon={Link2} variant="secondary" title="Client download link"
      description="The link is shown once and copied to your clipboard. Only its hash is stored."
      submitLabel="Create link"
      onSubmit={async (f) => {
        const r = await apiClient.post<{ url: string }>(`${path(jobId)}/share-links`, { include_raw: allowRaw && f.get("include_raw") === "on" });
        await navigator.clipboard?.writeText(r.url).catch(() => undefined);
        toast.success("Link copied", { description: r.url, timeout: 20_000 });
      }}>
      {allowRaw ? <CheckInput name="include_raw" label="Include raw files" /> : <p className="text-sm text-mute">Raw files are not shared (Admin setting).</p>}
    </FormDialog>
  );
}

export function RevokeLink({ id }: { id: string }) {
  return (
    <ActionButton icon={Link2Off} variant="danger-soft" confirm="Revoke this link? The client will no longer be able to download."
      success="Link revoked" run={() => apiClient.post(`/share-links/${encodeURIComponent(id)}/revoke`)}>
      Revoke
    </ActionButton>
  );
}

export function DownloadFile({ id }: { id: string }) {
  return (
    <ActionButton icon={Download} variant="ghost" run={async () => {
      const r = await apiClient.get<{ url: string }>(`/uploads/${encodeURIComponent(id)}/download`);
      window.open(r.url, "_blank", "noopener,noreferrer");
    }}>
      Download
    </ActionButton>
  );
}

