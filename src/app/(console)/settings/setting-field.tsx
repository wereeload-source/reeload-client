"use client";
import { Button, Label, Switch, toast } from "@heroui/react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, errorText } from "@/lib/api-client";

export function SettingField({ name, label, value, min, max, unit }: { name: string; label: string; value: number | boolean; min?: number; max?: number; unit?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(String(value));
  const [pending, setPending] = useState(false);

  async function save(next: number | boolean) {
    setPending(true);
    try {
      await apiClient.put(`/settings/${encodeURIComponent(name)}`, { value: next });
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      toast.danger(errorText(e));
      setDraft(String(value));
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

  const n = Number(draft);
  const valid = Number.isInteger(n) && (min === undefined || n >= min) && (max === undefined || n <= max);
  return (
    <form
      className="flex flex-wrap items-center gap-2 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save(n);
      }}
    >
      <label htmlFor={name} className="min-w-64">{label}</label>
      <input id={name} className="field w-24" type="number" min={min} max={max} step={1} value={draft} onChange={(e) => setDraft(e.target.value)} aria-invalid={!valid} />
      <span className="text-mute">{unit}{min !== undefined && max !== undefined ? ` (${min}–${max})` : ""}</span>
      <Button type="submit" size="sm" variant="secondary" isDisabled={!valid || draft === String(value)} isPending={pending}>
        <Save aria-hidden className="size-3.5" /> Save
      </Button>
    </form>
  );
}
