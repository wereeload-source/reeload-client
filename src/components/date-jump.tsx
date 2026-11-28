import { Button, Form } from "@heroui/react";
import { TextInput } from "@/components/fields";

/** Pick a day or month and reload the page for it (a plain GET, so the URL can be shared). */
export function DateJump({ action, name, label, type, value, after }: {
  action: string; name: string; label: string; type: "date" | "month"; value: string; after?: React.ReactNode;
}) {
  return (
    <Form action={action} className="flex flex-wrap items-end gap-2">
      <TextInput name={name} label={label} type={type as "date"} defaultValue={value} className="w-48" />
      <Button type="submit" variant="outline">Show</Button>
      {after && <span className="pb-2 text-[13px] text-mute">{after}</span>}
    </Form>
  );
}
