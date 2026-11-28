"use client";
import { Alert, Button, Form } from "@heroui/react";
import { CheckCircle2, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { CheckInput, SelectInput, TextAreaInput, TextInput } from "@/components/fields";
import { createJob } from "./actions";

const CITIES = ["Mumbai", "Pune", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Goa"].map((c) => ({ id: c, label: c }));
const METHODS = [{ id: "upi", label: "UPI" }, { id: "bank_transfer", label: "Bank transfer" }, { id: "cash", label: "Cash" }];

export function NewJobForm() {
  const [state, action, pending] = useActionState(createJob, null);
  const [advance, setAdvance] = useState("");
  const [consent, setConsent] = useState(false);
  const canConfirm = Number(advance) > 0 && consent;

  return (
    <Form action={action} className="box grid max-w-3xl gap-4 p-5">
      <p className="text-sm text-mute">A job stays a draft until the advance is recorded and the client consents.</p>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 font-semibold">Client</legend>
        <TextInput name="client" label="Client name" isRequired maxLength={120} />
        <TextInput name="phone" label="Phone" type="tel" inputMode="tel" isRequired maxLength={20} description="Repeat clients are matched by phone." />
        <TextInput name="whatsapp" label="WhatsApp" type="tel" inputMode="tel" placeholder="Same as phone if empty" maxLength={20} />
        <SelectInput name="city" label="City" options={CITIES} defaultValue="Hyderabad" isRequired />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 font-semibold">Shoot</legend>
        <TextInput name="address" label="Address" className="sm:col-span-2" maxLength={300} />
        <TextInput name="maps_url" label="Google Maps link" type="url" className="sm:col-span-2" maxLength={500} />
        <TextInput name="date" label="Date" type="date" />
        <TextInput name="time" label="Start time (IST)" type="time" />
        <TextInput name="hours" label="Duration (hours)" type="number" step="0.5" min="0.5" max="24" defaultValue="2" />
        <span />
        <TextInput name="onsite_name" label="On-site contact" maxLength={120} />
        <TextInput name="onsite_phone" label="On-site WhatsApp" type="tel" inputMode="tel" maxLength={20} description="Gets the check-in code." />
        <TextAreaInput name="brief" label="What to shoot" rows={2} className="sm:col-span-2" maxLength={2000} />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 font-semibold">Money</legend>
        <TextInput name="amount" label="Agreed amount (₹)" inputMode="numeric" isRequired />
        <TextInput name="advance" label="Advance received (₹)" inputMode="numeric" placeholder="Required to confirm" value={advance} onChange={setAdvance} />
        <SelectInput name="method" label="Advance method" options={METHODS} defaultValue="upi" />
        <TextInput name="reference" label="Reference" maxLength={120} />
        <CheckInput name="consent" label="Client consents to footage and location being recorded" isSelected={consent} onChange={setConsent} className="sm:col-span-2" />
      </fieldset>

      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content><Alert.Description>{state.error}</Alert.Description></Alert.Content>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" name="intent" value="draft" variant="secondary" isDisabled={pending}>
          <Save aria-hidden className="size-4" /> Save as draft
        </Button>
        <Button type="submit" name="intent" value="confirm" isDisabled={pending || !canConfirm} isPending={pending}>
          <CheckCircle2 aria-hidden className="size-4" /> Confirm job
        </Button>
      </div>
    </Form>
  );
}
