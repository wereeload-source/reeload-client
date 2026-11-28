"use client";
import { ActionButton } from "@/components/action-button";
import { TextAreaInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";

const url = (jobId: string) => `/me/shoots/${encodeURIComponent(jobId)}/respond`;

/** Accept (accent) and Decline (outline, asks why), as on the reelmaker mockup. */
export function Respond({ jobId }: { jobId: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-1">
        <ActionButton variant="primary" size="lg" fullWidth success="Accepted. It's in your calendar." run={() => apiClient.post(url(jobId), { accept: true })}>
          Accept
        </ActionButton>
      </div>
      <div className="flex-1">
        <FormDialog trigger="Decline" variant="outline" size="lg" fullWidth title="Decline this shoot"
          description="Operations has been told and will reassign this shoot." submitLabel="Decline" success="Declined"
          onSubmit={(f) => apiClient.post(url(jobId), { accept: false, reason: String(f.get("reason") ?? "").trim() })}>
          <TextAreaInput name="reason" label="Why can't you do it?" isRequired maxLength={300} />
        </FormDialog>
      </div>
    </div>
  );
}

export function DropOut({ jobId }: { jobId: string }) {
  return (
    <FormDialog trigger="I can't do this shoot" variant="ghost" size="sm" title="Give back this shoot"
      description="Operations and Admin are told straight away." submitLabel="Give it back" success="Shoot given back"
      onSubmit={(f) => apiClient.post(`/me/shoots/${encodeURIComponent(jobId)}/drop-out`, { reason: String(f.get("reason") ?? "").trim() })}>
      <TextAreaInput name="reason" label="Reason" isRequired maxLength={300} />
    </FormDialog>
  );
}
