"use client";
import { Alert, Button, Form } from "@heroui/react";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { TextInput } from "@/components/fields";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <Form action={action} className="grid gap-3">
      <input type="hidden" name="next" value={next} />
      <TextInput name="email" label="Email" type="email" autoComplete="email" isRequired />
      <TextInput name="password" label="Password" type="password" autoComplete="current-password" isRequired />
      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <Button type="submit" fullWidth isPending={pending}>
        <LogIn aria-hidden className="size-4" />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </Form>
  );
}
