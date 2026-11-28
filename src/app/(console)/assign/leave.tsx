"use client";
import { CalendarOff, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { SelectInput, TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";
import { istInstant } from "@/lib/format";
import type { Reelmaker } from "@/lib/types";

export function AddLeave({ reelmakers }: { reelmakers: Reelmaker[] }) {
  return (
    <FormDialog trigger="Add leave" icon={CalendarOff} variant="secondary" title="Add leave"
      description="Refused if the reelmaker already has a shoot in that time." success="Leave added"
      onSubmit={(f) => {
        const v = (k: string) => String(f.get(k) ?? "");
        const from = istInstant(v("from"), "00:00");
        const toDay = v("to") || v("from");
        // Leave covers whole days: up to the end of the last day.
        const to = toDay ? new Date(new Date(`${toDay}T00:00:00+05:30`).getTime() + 86_400_000).toISOString() : null;
        if (!from || !to) throw new Error("Pick the first and last day");
        return apiClient.post("/leave", { reelmaker_id: v("reelmaker_id"), from, to, note: v("note").trim() || null });
      }}>
      <SelectInput name="reelmaker_id" label="Reelmaker" isRequired options={reelmakers.filter((r) => r.active).map((r) => ({ id: r.id, label: r.full_name }))} />
      <div className="grid grid-cols-2 gap-3">
        <TextInput name="from" label="First day" type="date" isRequired />
        <TextInput name="to" label="Last day" type="date" />
      </div>
      <TextInput name="note" label="Note" maxLength={200} />
    </FormDialog>
  );
}

export function RemoveLeave({ id }: { id: string }) {
  return (
    <ActionButton icon={Trash2} variant="ghost" confirm="Remove this leave?" success="Leave removed" run={() => apiClient.del(`/leave/${encodeURIComponent(id)}`)}>
      Remove
    </ActionButton>
  );
}
