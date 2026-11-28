"use client";
import { KeyRound, UserCheck, UserX } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { resetPassword, setActive } from "./actions";

const orThrow = async (p: Promise<{ error?: string }>) => {
  const r = await p;
  if (r.error) throw new Error(r.error);
};

export function ToggleUser({ id, name, active }: { id: string; name: string; active: boolean }) {
  return (
    <ActionButton
      icon={active ? UserX : UserCheck}
      variant={active ? "danger-soft" : "secondary"}
      confirm={active ? `Disable ${name}? They are signed out at once and cannot sign in until enabled again.` : undefined}
      success={active ? `${name} disabled` : `${name} enabled`}
      run={() => orThrow(setActive(id, !active))}
    >
      {active ? "Disable" : "Enable"}
    </ActionButton>
  );
}

export function ResetPassword({ id, name }: { id: string; name: string }) {
  return (
    <FormDialog
      trigger="Reset password"
      icon={KeyRound}
      variant="ghost"
      size="sm"
      title={`Reset ${name}'s password`}
      description="They are signed out on every device and must use the new password."
      submitLabel="Set password"
      success="Password changed"
      onSubmit={(form) => orThrow(resetPassword(id, String(form.get("password") ?? "")))}
    >
      <TextInput name="password" label="New temporary password" isRequired minLength={8} autoComplete="new-password" description="At least 8 characters." />
    </FormDialog>
  );
}
