"use client";
import { Alert, Button, InputOTP } from "@heroui/react";
import { Camera, CheckCircle2, ImagePlus, MapPinCheck, RefreshCw, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, errorText } from "@/lib/api-client";
import { fileSize } from "@/lib/format";
import type { UploadRow } from "@/lib/types";
import { keepAwake, uploadFile, type Progress, type UploadKind } from "@/lib/uploader";

export type Stage = "start" | "otp" | "photos" | "upload";

const base = (jobId: string) => `/me/shoots/${encodeURIComponent(jobId)}/checkin`;

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <Alert status="danger" className="mt-3">
      <Alert.Indicator />
      <Alert.Content><Alert.Description>{children}</Alert.Description></Alert.Content>
    </Alert>
  );
}

export function ShootFlow({ jobId, stage: initial, sendsLeft: initialSends, resendIn, files }: {
  jobId: string; stage: Stage; sendsLeft: number; resendIn: number; files: UploadRow[];
}) {
  const [stage, setStage] = useState<Stage>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [sendsLeft, setSendsLeft] = useState(initialSends);
  const [wait, setWait] = useState(resendIn);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const sendCode = () => run(async () => {
    const r = await apiClient.post<{ sent_to: string; sends_left: number }>(`${base(jobId)}/start`);
    setSentTo(r.sent_to);
    setSendsLeft(r.sends_left);
    setWait(60);
    setStage("otp");
  });
  const verify = () => run(async () => {
    await apiClient.post(`${base(jobId)}/verify`, { code });
    setStage("photos");
  });
  const onPhotoError = useCallback((m: string) => setError(m), []);

  return (
    <>
      {stage === "start" && (
        <>
          <Button fullWidth size="lg" isPending={busy} onPress={sendCode}><MapPinCheck aria-hidden className="size-5" /> Reached / About to start</Button>
          <p className="mt-2 text-center text-[13px] text-mute">Tap after you have met the client. We send them a code on WhatsApp.</p>
        </>
      )}

      {stage === "otp" && (
        <div className="mcard">
          <h2 className="text-xl font-semibold">Ask the client for the code</h2>
          <p className="mt-1 text-sm text-mute">We sent a 6-digit code to WhatsApp {sentTo || "the on-site contact"}.</p>
          <div className="my-4 flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={(v: string) => setCode(v.replace(/\D/g, ""))} aria-label="Check-in code" inputMode="numeric" autoComplete="one-time-code">
              <InputOTP.Group>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}
              </InputOTP.Group>
            </InputOTP>
          </div>
          <Button fullWidth size="lg" isDisabled={code.length !== 6} isPending={busy} onPress={verify}><CheckCircle2 aria-hidden className="size-5" /> Verify code</Button>
          <Button fullWidth variant="secondary" className="mt-3" isDisabled={busy || wait > 0 || sendsLeft <= 0} onPress={sendCode}>
            <RefreshCw aria-hidden className="size-4" />
            {sendsLeft <= 0 ? "No more codes. Call Operations." : wait > 0 ? `Send again in ${wait}s` : `Send code again (${sendsLeft} left)`}
          </Button>
          <p className="mt-3 text-sm"><b>No answer in 5 minutes?</b> <span className="text-mute">Call Operations. They can approve your check-in with a reason.</span></p>
        </div>
      )}

      {stage === "photos" && <LivePhotos jobId={jobId} onDone={() => setStage("upload")} onError={onPhotoError} />}

      {stage === "upload" && <Uploads jobId={jobId} existing={files} />}

      {error && <Problem>{error}</Problem>}
    </>
  );
}

/** Two live photos with getUserMedia. No gallery, no location data. */
function LivePhotos({ jobId, onDone, onError }: { jobId: string; onDone: () => void; onError: (m: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [which, setWhich] = useState<"selfie" | "location">("selfie");
  const [ids, setIds] = useState<{ selfie?: string; location?: string }>({});
  const [busy, setBusy] = useState(false);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const ready = readyFor === which;

  useEffect(() => {
    let stream: MediaStream | undefined;
    let live = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => onError("This browser cannot open the camera. Use Safari or Chrome."));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: which === "selfie" ? "user" : "environment" }, audio: false })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) video.current.srcObject = s;
        setReadyFor(which);
      })
      .catch(() => onError("Allow camera access to take the check-in photos."));
    return () => {
      live = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [which, onError]);

  async function shoot() {
    const v = video.current;
    if (!v?.videoWidth) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1280 / v.videoWidth);
      c.width = v.videoWidth * scale;
      c.height = v.videoHeight * scale;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not take the photo"))), "image/jpeg", 0.8));
      const { upload_id, url } = await apiClient.post<{ upload_id: string; url: string }>("/uploads/proof", { job_id: jobId, which, size_bytes: blob.size });
      const put = await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
      if (!put.ok) throw new Error("Photo upload failed. Try again.");
      await apiClient.post(`/uploads/${encodeURIComponent(upload_id)}/complete`, { parts: [] });
      const next = { ...ids, [which]: upload_id };
      setIds(next);
      if (which === "selfie") setWhich("location");
      else {
        await apiClient.post(`${base(jobId)}/complete`, { selfie_upload_id: next.selfie, location_upload_id: next.location });
        onDone();
      }
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mcard">
      <h2 className="text-xl font-semibold">{which === "selfie" ? "1 of 2: selfie" : "2 of 2: the location"}</h2>
      <p className="mb-3 mt-1 text-sm text-mute">Camera only. The time is stamped by the server. No location is collected.</p>
      <video ref={video} autoPlay playsInline muted className={`aspect-[3/4] w-full rounded-2xl bg-[#1b1d21] object-cover ${which === "selfie" ? "-scale-x-100" : ""}`} />
      <Button fullWidth size="lg" className="mt-3" isDisabled={!ready} isPending={busy} onPress={shoot}>
        <Camera aria-hidden className="size-5" /> {busy ? "Saving…" : "Take photo"}
      </Button>
    </div>
  );
}

type Item = { key: string; name: string; size: number; file: File; p: Progress };

function Uploads({ jobId, existing }: { jobId: string; existing: UploadRow[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<UploadKind>("raw");
  const [items, setItems] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const update = (key: string, p: Progress) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, p } : x)));

  async function start(list: Item[], k: UploadKind) {
    const release = await keepAwake();
    for (const it of list) {
      try {
        await uploadFile({ jobId, kind: k, file: it.file, onProgress: (p) => update(it.key, p), signal: new AbortController().signal });
      } catch (e) {
        update(it.key, { ...it.p, state: "paused", error: errorText(e) });
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
    void start(list, kind);
  }

  const done = existing.filter((f) => f.status === "complete" && f.kind !== "proof");
  return (
    <>
      <div role="tablist" aria-label="What are you uploading?" className="mb-3 grid grid-cols-2 rounded-xl bg-sub p-1">
        {(["raw", "edited"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`rounded-[9px] p-2 font-semibold ${kind === k ? "bg-paper text-ink shadow" : "text-mute"}`}>
            {k === "raw" ? "Raw files" : "Edited reels"}
          </button>
        ))}
      </div>
      {/* No `capture` attribute: the phone offers Photos / gallery. */}
      <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <Button fullWidth size="lg" onPress={() => input.current?.click()}><ImagePlus aria-hidden className="size-5" /> Choose from Photos</Button>
      <div className="mt-3.5">
        {items.map((u) => (
          <div key={u.key} className="mb-2 rounded-[14px] bg-sub px-3 py-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <b className="truncate">{u.name}</b>
              <span className="whitespace-nowrap text-[13px] text-mute">
                {u.p.state === "done" ? "Uploaded" : u.p.state === "paused" ? "Paused" : `${Math.floor((u.p.sent / Math.max(u.p.total, 1)) * 100)}%`} · {fileSize(u.size)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor((u.p.sent / Math.max(u.p.total, 1)) * 100)} aria-label={u.name}>
              <i className={`block h-full ${u.p.state === "done" ? "bg-ok" : "bg-rec"}`} style={{ width: `${(u.p.sent / Math.max(u.p.total, 1)) * 100}%` }} />
            </div>
            {u.p.state === "paused" && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[13px] text-rec">
                {u.p.error ?? "Connection dropped."}
                <Button size="sm" variant="secondary" onPress={() => void start([u], u.key.startsWith("edited") ? "edited" : "raw")}><RotateCw aria-hidden className="size-3.5" /> Resume</Button>
              </div>
            )}
          </div>
        ))}
        {items.some((u) => u.p.state === "uploading") && <p className="text-center text-[13px] text-mute">Keep this page open. The screen stays awake while uploading.</p>}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="mx-1 mb-2 mt-4 font-bold">Already uploaded</h2>
          {done.map((f) => (
            <div key={f.id} className="flex justify-between border-b border-line px-1 py-2 text-sm">
              <span className="truncate">{f.file_name}</span>
              <span className="text-mute">{f.kind} · {fileSize(f.size_bytes)}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}
