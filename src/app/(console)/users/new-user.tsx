"use client";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { SelectInput, TextInput } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { createUser } from "./actions";

const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ id: r, label: ROLE_LABEL[r] }));

export function NewUser() {
  const [role, setRole] = useState<Role>("sales");
  return (
    <FormDialog
      trigger="New user"
      icon={UserPlus}
      title="New user"
      description="Give them a temporary password and ask them to change it after signing in."
      submitLabel="Create user"
      success="User created"
      onSubmit={async (form) => {
        const r = await createUser(null, form);
        if (r.error) throw new Error(r.error);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <TextInput name="full_name" label="Full name" isRequired maxLength={120} />
        <TextInput name="phone" label="Phone" type="tel" inputMode="tel" maxLength={20} />
        <TextInput name="email" label="Email" type="email" isRequired className="col-span-2" />
        <TextInput name="password" label="Temporary password" type="text" isRequired minLength={8} autoComplete="off" className="col-span-2" description="At least 8 characters." />
        <SelectInput name="role" label="Role" options={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v as Role)} isRequired />
        {role === "reelmaker" && (
          <>
            <SelectInput name="kind" label="Type" defaultValue="full_time" options={[{ id: "full_time", label: "Full time" }, { id: "freelance", label: "Freelance" }]} />
            <TextInput name="base_city" label="Base city" isRequired className="col-span-2" />
          </>
        )}
      </div>
    </FormDialog>
  );
}
