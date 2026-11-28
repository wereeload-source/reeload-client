"use client";
import { PhoneCall } from "lucide-react";
import { SelectInput, TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";
import { OUTCOME_LABEL, type ContactOutcome } from "@/lib/types";

const OUTCOMES = (Object.keys(OUTCOME_LABEL) as ContactOutcome[]).map((o) => ({ id: o, label: OUTCOME_LABEL[o] }));

export function LogCall() {
  return (
    <FormDialog trigger="Log call" icon={PhoneCall} title="Log a call" success="Call logged"
      onSubmit={(f) => {
        const v = (k: string) => String(f.get(k) ?? "").trim();
        return apiClient.post("/contacts", { client_name: v("name"), phone: v("phone") || null, outcome: v("outcome") || "spoken", note: v("note") || null });
      }}>
      <TextInput name="name" label="Client" isRequired maxLength={120} />
      <TextInput name="phone" label="Phone" type="tel" inputMode="tel" maxLength={24} />
      <SelectInput name="outcome" label="Outcome" options={OUTCOMES} defaultValue="spoken" isRequired />
      <TextInput name="note" label="Note" maxLength={500} />
    </FormDialog>
  );
}
