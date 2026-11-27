"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { callFn } from "@/lib/functions";
import { keepAwake, uploadFile, type Progress, type UploadKind } from "@/lib/uploader";

type Stage = "start" | "otp" | "photos" | "upload";
type FileRow = { id: string; kind: string; file_name: string; size_bytes: number; status: string };

const mb = (n: number) => (n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.max(0.1, n / 1e6).toFixed(1)} MB`);

export function ShootFlow({ jobId, stage: initial, files }: { jobId: string; stage: Stage; files: FileRow[] }) {
  const [stage, setStage] = useState<Stage>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const sendCode = () => run(async () => {
    const r = await callFn<{ sent_to: string }>("checkin", { action: "start", job_id: jobId });
    setSentTo(r.sent_to); setStage("otp");
  });

  return (
    <>
      {stage === "start" && (
        <>
          <button className="mbtn" disabled={busy} onClick={sendCode}>✓ Reached / About to start</button>
          <p className="mt-2 text-center text-[13px] text-mute">Tap after you have met the client.</p>
        </>
      )}

      {stage === "otp" && (
        <div className="mcard">
          <h3 className="text-xl">Ask the client for the code</h3>
          <p className="mt-1 text-sm text-mute">We sent a 6-digit code to WhatsApp {sentTo}.</p>
          <input className="input my-4 text-center font-mono text-2xl tracking-[.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Code" />
          <button className="mbtn" disabled={busy || code.length !== 6}
            onClick={() => run(async () => { await callFn("checkin", { action: "verify", job_id: jobId, code }); setStage("photos"); })}>Verify code</button>
          <button className="btn mt-3" disabled={busy} onClick={sendCode}>Send code again</button>
          <p className="mt-3 text-sm"><b>No answer in 5 minutes?</b> <span className="text-mute">Call operations and they can approve your check-in with a reason.</span></p>
        </div>
      )}

      {stage === "photos" && <LivePhotos jobId={jobId} onDone={() => setStage("upload")} onError={setError} />}

      {stage === "upload" && <Uploads jobId={jobId} existing={files} />}

      {error && <p className="mt-3 rounded-lg bg-recs p-2.5 text-sm text-rec">{error}</p>}
    </>
  );
}

/** Two live photos with getUserMedia. No gallery, no location. */
function LivePhotos({ jobId, onDone, onError }: { jobId: string; onDone: () => void; onError: (m: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [which, setWhich] = useState<"selfie" | "location">("selfie");
  const [ids, setIds] = useState<{ selfie?: string; location?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: which === "selfie" ? "user" : "environment" }, audio: false })
      .then((s) => { stream = s; if (video.current) video.current.srcObject = s; })
      .catch(() => onError("Allow camera access to take the check-in photos."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [which, onError]);

  async function shoot() {
    const v = video.current;
    if (!v?.videoWidth) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1280 / v.videoWidth);
      c.width = v.videoWidth * scale; c.height = v.videoHeight * scale;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.8));
      const { upload_id, url } = await callFn<{ upload_id: string; url: string }>("uploads", { action: "proof", job_id: jobId, which, size_bytes: blob.size });
      const put = await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
      if (!put.ok) throw new Error("Photo upload failed. Try again.");
      await callFn("uploads", { action: "complete", upload_id });
      const next = { ...ids, [which]: upload_id };
      setIds(next);
      if (which === "selfie") setWhich("location");
      else {
        await callFn("checkin", { action: "complete", job_id: jobId, selfie_upload_id: next.selfie, location_upload_id: next.location });
        onDone();
      }
    } catch (e) { onError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="mcard">
      <h3 className="text-xl">{which === "selfie" ? "1 of 2: selfie" : "2 of 2: location"}</h3>
      <p className="mb-3 mt-1 text-sm text-mute">Camera only. Time is stamped by the server. No location is collected.</p>
      <video ref={video} autoPlay playsInline muted className={`aspect-[3/4] w-full rounded-2xl bg-[#1b1d21] object-cover ${which === "selfie" ? "-scale-x-100" : ""}`} />
      <button className="mbtn mt-3" disabled={busy} onClick={shoot}>{busy ? "Saving…" : "Take photo"}</button>
    </div>
  );
}

type Item = { key: string; name: string; size: number; file: File; p: Progress };

function Uploads({ jobId, existing }: { jobId: string; existing: FileRow[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<UploadKind>("raw");
  const [items, setItems] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const update = (key: string, p: Progress) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, p } : x)));

  async function start(list: Item[]) {
    const release = await keepAwake();
    for (const it of list) {
      const ctrl = new AbortController();
      try {
        await uploadFile({ jobId, kind, file: it.file, onProgress: (p) => update(it.key, p), signal: ctrl.signal });
      } catch (e) {
        update(it.key, { ...it.p, state: "paused", error: (e as Error).message });
      }
    }
    release();
    router.refresh();
  }

  function pick(files: FileList | null) {
    const list = [...(files ?? [])].map((file) => ({
      key: `${kind}:${file.name}:${file.size}`, name: file.name, size: file.size, file,
      p: { sent: 0, total: file.size, state: "uploading" as const },
    }));
    setItems((xs) => [...xs.filter((x) => !list.some((l) => l.key === x.key)), ...list]);
    void start(list);
  }

  return (
    <>
      <div className="mb-3 grid grid-cols-2 rounded-xl bg-sub p-1">
        {(["raw", "edited"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`rounded-[9px] p-2 font-semibold ${kind === k ? "bg-paper text-ink shadow" : "text-mute"}`}>{k === "raw" ? "Raw files" : "Edited reels"}</button>
        ))}
      </div>
      {/* No `capture` attribute: the phone offers Photos / gallery. */}
      <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <button className="mbtn" onClick={() => input.current?.click()}>+ Choose from Photos</button>
      <div className="mt-3.5">
        {items.map((u) => (
          <div key={u.key} className="mb-2 rounded-[14px] bg-sub px-3 py-2.5 text-sm">
            <div className="flex justify-between gap-2"><b className="truncate">{u.name}</b>
              <span className="whitespace-nowrap text-[13px] text-mute">{u.p.state === "done" ? "Uploaded" : u.p.state === "paused" ? "Paused" : `${Math.floor((u.p.sent / u.p.total) * 100)}%`} · {mb(u.size)}</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"><i className={`block h-full ${u.p.state === "done" ? "bg-ok" : "bg-rec"}`} style={{ width: `${(u.p.sent / u.p.total) * 100}%` }} /></div>
            {u.p.state === "paused" && (
              <div className="mt-2 flex items-center justify-between text-[13px] text-rec">{u.p.error ?? "Connection dropped."}
                <button className="btn min-h-8 px-2.5 py-1" onClick={() => void start([u])}>Resume</button></div>
            )}
          </div>
        ))}
        {items.some((u) => u.p.state === "uploading") && <p className="text-center text-[13px] text-mute">Keep this page open. The screen stays awake while uploading.</p>}
      </div>
      {existing.length > 0 && (
        <>
          <div className="mx-1 mb-2 mt-4 font-bold">Already uploaded</div>
          {existing.filter((f) => f.status === "complete").map((f) => (
            <div key={f.id} className="flex justify-between border-b border-line px-1 py-2 text-sm"><span className="truncate">{f.file_name}</span><span className="text-mute">{f.kind} · {mb(f.size_bytes)}</span></div>
          ))}
        </>
      )}
    </>
  );
}
