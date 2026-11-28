"use client";
import { Button, Card, Form, ToggleButton, ToggleButtonGroup, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextInput } from "@/components/fields";
import { apiClient, errorText } from "@/lib/api-client";
import { inr } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "upi", label: "UPI", hint: "UPI transaction ID" },
  { id: "bank_transfer", label: "Bank", hint: "Bank reference" },
  { id: "cash", label: "Cash", hint: "Cash receipt number (optional)" },
];

/** "Record a payment" from the Accounts mockup: amount, UPI / Bank / Cash, reference. */
export function RecordPayment({ jobId, balance, owed, canPay }: { jobId: string; balance: number; owed: number; canPay: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const amt = Number(amount) || 0;
  const needRef = method !== "cash";
  const paid = balance <= 0;
  const ready = canPay && !paid && amt > 0 && amt <= balance && (!needRef || reference.trim().length > 0);

  let note = { text: "Balance = agreed amount + approved changes − payments. The job shows Paid at zero.", cls: "text-mute2" };
  if (!canPay) note = { text: "Payments can only be recorded on confirmed jobs.", cls: "text-warn" };
  else if (paid) note = { text: "This job is Paid. Operations can now create the 7-day download link.", cls: "text-ok" };
  else if (amt > balance) note = { text: `This is more than the balance of ${inr(balance)}. Check the amount before recording.`, cls: "text-warn" };

  async function record() {
    if (!ready) return;
    setBusy(true);
    try {
      await apiClient.post(`/jobs/${encodeURIComponent(jobId)}/payments`, { amount: amt, method, reference: reference.trim() || null });
      toast.success(`${inr(amt)} recorded${amt >= balance ? ". The job is now Paid." : "."}`);
      setAmount("");
      setReference("");
      router.refresh();
    } catch (e) {
      toast.danger(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3.5 px-6 py-[22px]">
      <h3 className="m-0 text-lg font-semibold">Record a payment</h3>
      <Form onSubmit={(e) => (e.preventDefault(), record())} className="flex flex-wrap items-end gap-3.5">
        <TextInput name="amount" label="Amount (₹)" inputMode="numeric" placeholder="0" value={amount} onChange={(v) => setAmount(v.replace(/[^0-9]/g, ""))} className="flex-[1_1_160px]" inputClassName="font-mono" />
        <div className="flex flex-[1_1_220px] flex-col gap-1.5">
          <span id="method-label" className="text-sm font-medium">Method</span>
          <ToggleButtonGroup
            aria-labelledby="method-label"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([method])}
            onSelectionChange={(keys) => setMethod(([...keys][0] as PaymentMethod) ?? "upi")}
            className="w-full"
          >
            {METHODS.map((m, i) => (
              <ToggleButton key={m.id} id={m.id} className="flex-1">
                {i > 0 && <ToggleButtonGroup.Separator />}
                {m.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <TextInput name="reference" label="Reference" placeholder={METHODS.find((m) => m.id === method)!.hint} value={reference} onChange={setReference} maxLength={120} className="flex-[2_1_220px]" />
        <Button type="submit" isDisabled={!ready} isPending={busy}>Record payment</Button>
      </Form>
      <div role="status" className={`text-[13px] font-medium ${note.cls}`}>{note.text}</div>
      <div className="text-xs text-mute">Owed in total: {inr(owed)} · Balance now: {inr(balance)}</div>
    </Card>
  );
}
