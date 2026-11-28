"use client";
import { Alert, Button, Card, Form } from "@heroui/react";
import { useState } from "react";
import { TextInput } from "@/components/fields";
import { signOutFully } from "@/components/sign-out";
import { apiClient, errorText } from "@/lib/api-client";
import { ROLE_LABEL, type Profile } from "@/lib/types";

/** The signed-in person's details and a password change (which signs them out everywhere). */
export function Account({ me }: { me: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const current = String(f.get("current") ?? "");
    const next = String(f.get("next") ?? "");
    if (next.length < 8) return setError("Use at least 8 characters for the new password.");
    if (next !== String(f.get("again") ?? "")) return setError("The two new passwords are not the same.");
    setBusy(true);
    setError(null);
    try {
      await apiClient.post("/auth/password", { current_password: current, new_password: next });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <Card className="min-w-[280px] flex-[1_1_320px] gap-3 p-6">
        <h2 className="m-0 text-lg font-semibold">Your details</h2>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-mute">Name</dt>
          <dd className="m-0 font-medium">{me.full_name}</dd>
          <dt className="text-mute">Email</dt>
          <dd className="m-0">{me.email}</dd>
          <dt className="text-mute">Phone</dt>
          <dd className="m-0 font-mono">{me.phone ?? "Not set"}</dd>
          <dt className="text-mute">Role</dt>
          <dd className="m-0">{ROLE_LABEL[me.role]}</dd>
        </dl>
        <p className="m-0 text-xs text-mute">To change your name, phone or role, ask an admin.</p>
      </Card>

      <Card className="min-w-[280px] flex-[1_1_360px] gap-4 p-6">
        <h2 className="m-0 text-lg font-semibold">Change password</h2>
        {done ? (
          <>
            <Alert status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>Password changed. You have been signed out on every device. Sign in again with the new password.</Alert.Description>
              </Alert.Content>
            </Alert>
            <Button className="self-start" onPress={() => void signOutFully()}>Sign in again</Button>
          </>
        ) : (
          <Form onSubmit={submit} className="flex flex-col gap-3.5">
            <TextInput name="current" label="Current password" type="password" autoComplete="current-password" isRequired />
            <TextInput name="next" label="New password" type="password" autoComplete="new-password" isRequired minLength={8} description="At least 8 characters." />
            <TextInput name="again" label="New password again" type="password" autoComplete="new-password" isRequired minLength={8} />
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content>
              </Alert>
            )}
            <Button type="submit" isPending={busy} className="self-start">Change password</Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
