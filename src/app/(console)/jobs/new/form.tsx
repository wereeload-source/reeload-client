"use client";
import { Alert, Button, Card, Fieldset, Form } from "@heroui/react";
import { TriangleAlert } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { CheckInput, SelectInput, TextAreaInput, TextInput } from "@/components/fields";
import { Chip } from "@/components/ui";
import { inr } from "@/lib/format";
import { createJob } from "./actions";

const CITIES = ["Mumbai", "Pune", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Kochi", "Jaipur", "Goa"].map((c) => ({ id: c, label: c }));
const METHODS = [{ id: "upi", label: "UPI" }, { id: "bank_transfer", label: "Bank transfer" }, { id: "cash", label: "Cash" }];
const digits = (v: string) => v.replace(/[^0-9]/g, "");

function Step({ label, state }: { label: string; state: "done" | "now" | "todo" }) {
  const dot = state === "done" ? "bg-ok" : state === "now" ? "bg-rec" : "bg-[#d5d8de]";
  return (
    <li className={`flex items-center gap-2.5 ${state === "todo" ? "text-mute" : "text-ink"} ${state === "now" ? "font-semibold" : ""}`}>
      <span aria-hidden className={`inline-block size-5 rounded-full ${dot}`} />
      {label}
    </li>
  );
}

/** Sales: a new job. It can only be confirmed with an advance, consent and an agreed amount (the mockup's rule). */
export function NewJobForm() {
  const [state, action, pending] = useActionState(createJob, null);
  const [agreed, setAgreed] = useState("");
  const [advance, setAdvance] = useState("");
  const [consent, setConsent] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const a = Number(agreed) || 0;
  const adv = Number(advance) || 0;

  const reason =
    adv <= 0 ? "Enter the advance received. A job cannot be confirmed without one."
    : !consent ? "Tick the client consent box first."
    : a <= 0 ? "Enter the agreed amount."
    : !date || !start ? "Set the shoot date and start time."
    : "";

  return (
    <Form
      className="flex flex-wrap items-start gap-6"
      onSubmit={(e) => {
        // Run the action by hand so a refused save keeps everything that was typed (a form action would reset the form).
        e.preventDefault();
        const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(data));
      }}
    >
      <section className="flex min-w-0 flex-[2_1_560px] flex-col gap-[18px]">
        <div>
          <div className="text-[13px] font-medium text-mute">Jobs / New job</div>
          <h1 className="m-0 mt-1 text-[30px] font-bold tracking-tight">New job</h1>
        </div>

        <Alert status="accent" className="bg-infos text-[#1f3fa8]">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              <strong>Repeat clients</strong> are matched by phone number: their details and earlier jobs are linked when you save.
            </Alert.Description>
          </Alert.Content>
        </Alert>

        <Card className="gap-[22px] p-6">
          <Fieldset className="gap-3.5">
            <Fieldset.Legend className="mb-1.5 font-display text-[17px] font-semibold">Client and place</Fieldset.Legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
              <TextInput name="client" label="Client name" isRequired maxLength={120} />
              <TextInput name="phone" label="Phone" type="tel" inputMode="tel" isRequired maxLength={20} />
              <TextInput name="whatsapp" label="WhatsApp number" type="tel" inputMode="tel" placeholder="Same as phone if empty" maxLength={20} />
              <SelectInput name="city" label="City" options={CITIES} defaultValue="Hyderabad" isRequired />
              <TextInput name="address" label="Address" maxLength={300} />
              <TextInput name="maps_url" label="Google Maps link" type="url" placeholder="Paste the link" maxLength={500} />
              <TextInput name="date" label="Date" type="date" value={date} onChange={setDate} />
              <div className="grid grid-cols-2 gap-3.5">
                <TextInput name="time" label="Start (IST)" type="time" value={start} onChange={setStart} />
                <TextInput name="hours" label="Hours" type="number" step="0.5" min="0.5" max="24" defaultValue="2" />
              </div>
              <TextInput name="onsite_name" label="On-site contact" maxLength={120} />
              <TextInput name="onsite_phone" label="On-site WhatsApp" type="tel" inputMode="tel" maxLength={20} description="Gets the check-in code." />
            </div>
          </Fieldset>

          <Fieldset className="gap-3.5">
            <Fieldset.Legend className="mb-1.5 font-display text-[17px] font-semibold">What to shoot</Fieldset.Legend>
            <TextAreaInput name="brief" label="Brief for the reelmaker" rows={3} maxLength={2000} />
            <CheckInput name="consent" label="Client agrees to footage and location being recorded" isSelected={consent} onChange={setConsent} />
          </Fieldset>

          <Fieldset className="gap-3.5">
            <Fieldset.Legend className="mb-1.5 font-display text-[17px] font-semibold">Money</Fieldset.Legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-end gap-3.5">
              <TextInput name="amount" label="Agreed amount (₹, typed by hand)" inputMode="numeric" isRequired value={agreed} onChange={(v) => setAgreed(digits(v))} inputClassName="font-mono" />
              <TextInput name="advance" label="Advance received (₹)" inputMode="numeric" placeholder="0" value={advance} onChange={(v) => setAdvance(digits(v))} inputClassName="font-mono" />
              <SelectInput name="method" label="Advance paid by" options={METHODS} defaultValue="upi" />
              <TextInput name="reference" label="Reference" placeholder="UPI or bank reference" maxLength={120} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-mute">Quick advance:</span>
              {[30, 50].map((p) => (
                <Button key={p} variant="outline" size="sm" className="rounded-full" isDisabled={a <= 0} onPress={() => setAdvance(String(Math.round((a * p) / 100)))}>
                  {p}%
                </Button>
              ))}
            </div>
          </Fieldset>
        </Card>
      </section>

      <aside className="flex max-w-[380px] min-w-[280px] flex-[1_1_300px] flex-col gap-4">
        <Card className="gap-4 p-[22px]">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-semibold">Job summary</h2>
            <Chip tone="neutral">Draft</Chip>
          </div>
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 text-sm">
            <dt className="text-mute">Agreed</dt>
            <dd className="m-0 font-mono">{inr(a)}</dd>
            <dt className="text-mute">Advance</dt>
            <dd className="m-0 font-mono">{inr(adv)}</dd>
            <dt className="border-t border-line2 pt-2.5 font-semibold">Balance due</dt>
            <dd className="m-0 border-t border-line2 pt-2.5 font-mono font-semibold">{inr(Math.max(a - adv, 0))}</dd>
          </dl>
          <ol className="m-0 flex list-none flex-col gap-2 p-0 text-[13px]">
            <Step label="Lead logged" state="done" />
            <Step label="Confirmed with advance" state="now" />
            <Step label="Ready for Operations to assign" state="todo" />
          </ol>

          {state?.error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content><Alert.Description>{state.error}</Alert.Description></Alert.Content>
            </Alert>
          )}
          <Button type="submit" name="intent" value="confirm" size="lg" fullWidth isDisabled={pending || !!reason} isPending={pending}>
            Confirm job
          </Button>
          {reason && (
            <div role="status" className="flex gap-2 rounded-lg bg-warns px-3 py-2.5 text-[13px] leading-snug text-warn">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 flex-none" />
              <span>{reason}</span>
            </div>
          )}
          <Button type="submit" name="intent" value="draft" variant="outline" fullWidth isDisabled={pending}>
            Save as draft
          </Button>
        </Card>
        <p className="m-0 px-1 text-xs leading-normal text-mute">
          After confirmation, any price change needs admin approval and is written to the audit log. Operations never sees these amounts.
        </p>
      </aside>
    </Form>
  );
}
