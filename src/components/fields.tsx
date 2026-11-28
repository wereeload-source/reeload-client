"use client";
import { Checkbox, Description, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";

type Common = { name: string; label: string; description?: string; isRequired?: boolean; className?: string };

export function TextInput({
  name, label, description, isRequired, className, inputClassName, type = "text", defaultValue, value, onChange, placeholder, inputMode, autoComplete, minLength, maxLength, min, max, step,
}: Common & {
  inputClassName?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "datetime-local";
  defaultValue?: string; value?: string; onChange?: (v: string) => void; placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string;
  minLength?: number; maxLength?: number; min?: number | string; max?: number | string; step?: number | string;
}) {
  return (
    <TextField name={name} type={type} isRequired={isRequired} defaultValue={defaultValue} value={value} onChange={onChange} className={className ?? "w-full"}>
      <Label>{label}</Label>
      <Input className={inputClassName} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} min={min} max={max} step={step} />
      {description && <Description>{description}</Description>}
    </TextField>
  );
}

export function TextAreaInput({ name, label, description, isRequired, className, rows = 3, defaultValue, maxLength }: Common & { rows?: number; defaultValue?: string; maxLength?: number }) {
  return (
    <TextField name={name} isRequired={isRequired} defaultValue={defaultValue} className={className ?? "w-full"}>
      <Label>{label}</Label>
      <TextArea rows={rows} maxLength={maxLength} />
      {description && <Description>{description}</Description>}
    </TextField>
  );
}

export function SelectInput({ name, label, description, isRequired, className, options, defaultValue, value, onChange }: Common & {
  options: { id: string; label: string }[]; defaultValue?: string; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <Select
      name={name}
      isRequired={isRequired}
      className={className ?? "w-full"}
      defaultSelectedKey={defaultValue}
      selectedKey={value}
      onSelectionChange={(k) => onChange?.(String(k))}
      placeholder="Choose…"
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {description && <Description>{description}</Description>}
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function CheckInput({ name, label, isSelected, onChange, className }: { name: string; label: string; isSelected?: boolean; onChange?: (v: boolean) => void; className?: string }) {
  return (
    <Checkbox name={name} value="on" isSelected={isSelected} onChange={onChange} className={className}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
    </Checkbox>
  );
}
