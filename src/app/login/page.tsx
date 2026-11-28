import { Alert, Card } from "@heroui/react";
import { safeNext } from "@/lib/token";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; disabled?: string }> }) {
  const { next, disabled } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2.5 font-display text-xl font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/logo.svg" alt="" width={32} height={32} /> Reeload
        </div>
        {disabled && (
          <Alert status="danger" className="mb-3">
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
