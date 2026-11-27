// Public client download page. No login: the token is checked by the share-link-resolve function.
type Result = { client: string; job: string; expires_at: string; files: { name: string; kind: string; size_bytes: number; url: string }[] } | { error: string };

export default async function Download({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/share-link-resolve?token=${encodeURIComponent(token)}`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    cache: "no-store",
  });
  const data = (await res.json()) as Result;
  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-2.5 font-display text-xl font-bold">{/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/logo.svg" alt="" width={30} height={30} /> ReelOps</div>
      {"error" in data ? (
        <div className="card"><h3>{data.error}</h3><p className="text-mute">Ask the team for a new link.</p></div>
      ) : (
        <div className="card">
          <h3>{data.client} · {data.job}</h3>
          <p className="mb-3 text-sm text-mute">This link expires on {new Date(data.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.</p>
          {data.files.map((f) => (
            <a key={f.url} href={f.url} className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
              <span className="truncate">{f.name}</span><span className="btn">Download</span>
            </a>
          ))}
          {!data.files.length && <p className="text-mute">The files are no longer available.</p>}
        </div>
      )}
    </main>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
