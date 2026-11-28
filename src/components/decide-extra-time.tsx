"use client";
import { BadgeIndianRupee, Ban } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";

/** Charge the client for extra time (creates a price change Admin approves) or let it go. */
export function DecideExtraTime({ id }: { id: string }) {
  const url = `/extra-time/${encodeURIComponent(id)}/decision`;
  return (
    <div className="flex justify-end gap-1.5">
      <ActionButton icon={Ban} run={() => apiClient.post(url, { charge: false })} success="Not charged">No charge</ActionButton>
      <FormDialog trigger="Charge" icon={BadgeIndianRupee} size="sm" title="Charge for extra time" success="Price change created"
        description="Creates a price change that Admin must approve."
        onSubmit={(f) => apiClient.post(url, { charge: true, amount: Number(String(f.get("amount") ?? "").replace(/[,₹\s]/g, "")) })}>
        <TextInput name="amount" label="Extra amount (₹)" inputMode="numeric" isRequired />
      </FormDialog>
    </div>
  );
}
