import { Alert, Card } from "@heroui/react";
import { Clock3, Play } from "lucide-react";
import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { LinkButton } from "@/components/link-button";
import { fileSize, longDay } from "@/lib/format";
import { API_URL } from "@/lib/token";
import type { PublicShare } from "@/lib/types";
import { DownloadAll } from "./download-all";

// Download links are private: keep them out of search engines and out of the Referer header.
export const metadata: Metadata = { title: "Your reels · Reeload", robots: { index: false, follow: false }, referrer: "no-referrer" };

type Result = { ok: true; data: PublicShare } | { ok: false; expired: boolean; message: string };

async function resolve(token: string): Promise<Result> {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return { ok: false, expired: false, message: "This link is not valid" };
  try {
    const res = await fetch(`${API_URL()}/public/share/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as PublicShare };
    if (res.status === 410) return { ok: false, expired: true, message: "This link has expired" };
    if (res.status === 429) return { ok: false, expired: false, message: "Too many tries. Wait a minute and reload." };
    return { ok: false, expired: false, message: "This link is not valid" };
  } catch {
    return { ok: false, expired: false, message: "We could not load your files right now. Try again in a moment." };
  }
}

const ext = (name: string) => (name.split(".").pop() ?? "").toUpperCase();

/** Public client download page from the mockup. No sign-in: the token in the address is the key. */
export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await resolve(token);
  const edited = r.ok ? r.data.files.filter((f) => f.kind === "edited") : [];
  const raw = r.ok ? r.data.files.filter((f) => f.kind === "raw") : [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-paper">
      <header className="flex flex-none items-center border-b border-line px-5 py-[18px]">
        <Brand small onLight />
      </header>

      {!r.ok ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="flex size-[72px] items-center justify-center rounded-full bg-neutrals">
            <Clock3 aria-hidden className="size-8 text-neutral" strokeWidth={1.8} />
          </div>
          <h1 className="m-0 text-[26px] font-bold tracking-tight">{r.message}</h1>
          <p className="m-0 max-w-[300px] text-[15px] leading-relaxed text-mute2">
            {r.expired ? "Download links work for 7 days. " : ""}Ask your contact at Reeload and they will send you a new one.
          </p>
        </main>
      ) : (
        <>
          <main className="flex flex-1 flex-col gap-[18px] px-5 py-[22px]">
            <div>
              <h1 className="m-0 text-[28px] font-bold leading-tight tracking-tight">Your reels are ready</h1>
              <p className="m-0 mt-1.5 text-sm text-mute2">
                {r.data.client}{r.data.shot_on ? ` · shot on ${longDay(r.data.shot_on)}` : ""}
              </p>
            </div>
            <Alert status="warning" className="bg-warns">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description className="text-[13px] font-medium text-[#6b4000]">
                  This link works until {longDay(r.data.expires_at)}. Please download your files before then.
                </Alert.Description>
              </Alert.Content>
            </Alert>

            {edited.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="m-0 text-[17px] font-semibold">Edited reels</h2>
                {edited.map((f) => (
                  <Card key={f.url} className="gap-0 overflow-hidden p-0">
                    <div className="flex h-[150px] items-center justify-center bg-side">
                      <div className="flex size-[52px] items-center justify-center rounded-full bg-rec">
                        <Play aria-hidden className="size-[22px] fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2.5 px-3.5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{f.name}</div>
                        <div className="text-xs text-mute">{fileSize(f.size_bytes)} · {ext(f.name)}</div>
                      </div>
                      <LinkButton href={f.url} external className="bg-ink">Download</LinkButton>
                    </div>
                  </Card>
                ))}
              </section>
            )}

            {raw.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <h2 className="m-0 text-[17px] font-semibold">Raw files</h2>
                {raw.map((f) => (
                  <Card key={f.url} className="flex-row items-center justify-between gap-2.5 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{f.name}</div>
                      <div className="text-xs text-mute">{fileSize(f.size_bytes)} · {ext(f.name)}</div>
                    </div>
                    <LinkButton href={f.url} external variant="outline">Download</LinkButton>
                  </Card>
                ))}
              </section>
            )}

            {!r.data.files.length && <p className="m-0 text-mute">The files are no longer available.</p>}
            <p className="m-0 text-xs leading-normal text-mute">Files are kept for a limited time and then deleted automatically. A deleted file cannot be downloaded.</p>
          </main>
          {r.data.files.length > 1 && (
            <footer className="sticky bottom-0 flex-none border-t border-line bg-paper px-5 pb-[18px] pt-3">
              <DownloadAll urls={r.data.files.map((f) => f.url)} />
            </footer>
          )}
        </>
      )}
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
