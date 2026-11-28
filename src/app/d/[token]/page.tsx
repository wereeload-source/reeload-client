import { Download, FileVideo, LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { fileSize, longDay } from "@/lib/format";
import { API_URL } from "@/lib/token";
import type { PublicShare } from "@/lib/types";

// Download links are private: keep them out of search engines and out of the Referer header.
export const metadata: Metadata = { title: "Your reels · Reeload", robots: { index: false, follow: false }, referrer: "no-referrer" };

type Result = { ok: true; data: PublicShare } | { ok: false; message: string };

async function resolve(token: string): Promise<Result> {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return { ok: false, message: "This link is not valid" };
  try {
    const res = await fetch(`${API_URL()}/public/share/${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as PublicShare };
    if (res.status === 410) return { ok: false, message: "This link has expired" };
    if (res.status === 429) return { ok: false, message: "Too many tries. Wait a minute and reload." };
    return { ok: false, message: "This link is not valid" };
  } catch {
    return { ok: false, message: "We could not load your files right now. Try again in a moment." };
  }
}

/** Public client download page. No sign-in: the token in the address is the key. */
export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await resolve(token);
  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-2.5 font-display text-xl font-bold">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
        <img src="/logo.svg" alt="" width={30} height={30} /> Reeload
      </div>
      {!r.ok ? (
        <div className="box">
          <h3><LinkIcon aria-hidden className="size-4 text-mute" />{r.message}</h3>
          <p className="text-mute">Ask the team for a new link.</p>
        </div>
      ) : (
        <div className="box">
          <h3>{r.data.client} · {r.data.job}</h3>
          <p className="mb-3 text-sm text-mute">
            {r.data.shot_on && <>Shot on {longDay(r.data.shot_on)}. </>}This link works until {longDay(r.data.expires_at)}.
          </p>
          {r.data.files.map((f) => (
            <a key={f.url} href={f.url} rel="noopener noreferrer" className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 hover:bg-sub">
              <FileVideo aria-hidden className="size-4 flex-none text-mute" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-[13px] text-mute">{f.kind === "raw" ? "Raw · " : ""}{fileSize(f.size_bytes)}</span>
              <span className="button button--secondary button--sm"><Download aria-hidden className="size-4" /> Download</span>
            </a>
          ))}
          {!r.data.files.length && <p className="text-mute">The files are no longer available.</p>}
        </div>
      )}
    </main>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
