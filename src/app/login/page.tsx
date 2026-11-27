import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; disabled?: string }> }) {
  const { next, disabled } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2.5 font-display text-xl font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/logo.svg" alt="" width={32} height={32} /> ReelOps
        </div>
        {disabled && <p className="mb-3 rounded-lg bg-recs p-2.5 text-[13px] text-rec">Your account is disabled. Ask an admin.</p>}
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
