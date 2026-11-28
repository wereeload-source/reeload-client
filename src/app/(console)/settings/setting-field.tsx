"use client";
import { Button, Description, Form, Label, NumberField, Switch, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, errorText } from "@/lib/api-client";

export function SettingField({ name, label, value, min, max, unit }: { name: string; label: string; value: number | boolean; min?: number; max?: number; unit?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<number>(typeof value === "number" ? value : 0);
  const [pending, setPending] = useState(false);

  async function save(next: number | boolean) {
    setPending(true);
    try {
      await apiClient.put(`/settings/${encodeURIComponent(name)}`, { value: next });
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      toast.danger(errorText(e));
      if (typeof value === "number") setDraft(value);
    } finally {
      setPending(false);
    }
  }

  if (typeof value === "boolean") {
    return (
      <Switch isSelected={value} isDisabled={pending} onChange={(v) => void save(v)}>
        <Switch.Control><Switch.Thumb /></Switch.Control>
        <Switch.Content><Label>{label}</Label></Switch.Content>
      </Switch>
    );
  }

  const valid = Number.isInteger(draft) && (min === undefined || draft >= min) && (max === undefined || draft <= max);
  return (
    <Form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save(draft);
      }}
    >
      <NumberField value={draft} onChange={setDraft} minValue={min} maxValue={max} step={1} name={name} className="min-w-64 flex-1">
        <Label>{label}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input className="w-20 font-mono" />
          <NumberField.IncrementButton />
        </NumberField.Group>
        <Description>{unit}{min !== undefined && max !== undefined ? `, ${min} to ${max}` : ""}</Description>
      </NumberField>
      <Button type="submit" variant="outline" isDisabled={!valid || draft === value} isPending={pending}>Save</Button>
    </Form>
  );
}
