"use client";
import { IndianRupee } from "lucide-react";
import { SelectInput, TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { apiClient } from "@/lib/api-client";
import { inr } from "@/lib/format";

const METHODS = [{ id: "upi", label: "UPI" }, { id: "bank_transfer", label: "Bank transfer" }, { id: "cash", label: "Cash" }];

export function RecordPayment({ jobId, code, balance }: { jobId: string; code: string; balance: number }) {
  return (
    <FormDialog trigger="Record payment" icon={IndianRupee} variant="secondary" size="sm" title="Record payment"
      description={`${code} · balance ${inr(balance)}`} submitLabel="Save payment" success="Payment recorded"
      onSubmit={(f) => {
        const v = (k: string) => String(f.get(k) ?? "").trim();
        const amount = Number(v("amount").replace(/[,₹\s]/g, ""));
        if (!(amount > 0)) throw new Error("Enter the amount received");
        if (amount > balance) throw new Error(`That is more than the balance of ${inr(balance)}`);
        return apiClient.post(`/jobs/${encodeURIComponent(jobId)}/payments`, { amount, method: v("method") || "upi", reference: v("reference") || null });
      }}>
      <div className="grid grid-cols-2 gap-3">
        <TextInput name="amount" label="Amount (₹)" inputMode="numeric" defaultValue={String(balance)} isRequired />
        <SelectInput name="method" label="Method" options={METHODS} defaultValue="upi" isRequired />
        <TextInput name="reference" label="Reference" maxLength={120} className="col-span-2" />
      </div>
    </FormDialog>
  );
}
