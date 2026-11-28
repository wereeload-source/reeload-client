import { Alert, Card } from "@heroui/react";
import { Brand } from "@/components/brand";
import { safeNext } from "@/lib/token";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; disabled?: string }> }) {
  const { next, disabled } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-4">
      <Card className="w-full max-w-sm gap-5 p-7">
        <Brand small onLight />
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="m-0 mt-1 text-[13px] text-mute">Office console and reelmaker app.</p>
        </div>
        {disabled && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>Your account is disabled. Ask an admin.</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
        <LoginForm next={safeNext(next)} />
      </Card>
    </main>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
