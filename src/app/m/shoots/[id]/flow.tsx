"use client";
import { Alert, Button, Card, InputOTP, Label, Link, ProgressBar, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Camera, CheckCircle2, MapPin, Phone, RotateCw, Upload, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, errorText } from "@/lib/api-client";
import { fileSize } from "@/lib/format";
import type { UploadRow } from "@/lib/types";
import { keepAwake, uploadFile, type Progress, type UploadKind } from "@/lib/uploader";
import { MFooter, MHeader, MMain } from "../../header";

export type Stage = "start" | "otp" | "photos" | "upload";

export type ShootInfo = {
  client: string;
  code: string;
  when: string;
  address: string;
  mapHref: string | null;
  contactName: string | null;
  contactPhone: string | null;
  brief: string | null;
};

const base = (jobId: string) => `/me/shoots/${encodeURIComponent(jobId)}/checkin`;
const STEP: Record<Stage, 1 | 2 | 3> = { start: 1, otp: 1, photos: 2, upload: 3 };
const SUB: Record<Stage, string> = {
  start: "Tap the button when you meet the client",
  otp: "Step 1 of 3 · code from the client",
  photos: "Step 2 of 3 · two live photos",
  upload: "Step 3 of 3 · upload files",
};

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content><Alert.Description>{children}</Alert.Description></Alert.Content>
    </Alert>
  );
}

/** Shoot day for a reelmaker, as in the mockup: job → WhatsApp code → two live photos → uploads. */
export function ShootFlow({ jobId, shoot, stage: initial, sendsLeft: initialSends, resendIn, files, dropOut }: {
  jobId: string; shoot: ShootInfo; stage: Stage; sendsLeft: number; resendIn: number; files: UploadRow[]; dropOut?: React.ReactNode;
}) {
  const [stage, setStage] = useState<Stage>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [sendsLeft, setSendsLeft] = useState(initialSends);
  const [wait, setWait] = useState(resendIn);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoIds, setPhotoIds] = useState<{ selfie?: string; location?: string }>({});

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
  const sendCode = () =>
    run(async () => {
      const r = await apiClient.post<{ sent_to: string; sends_left: number }>(`${base(jobId)}/start`);
      setSentTo(r.sent_to);
      setSendsLeft(r.sends_left);
      setWait(60);
      setStage("otp");
    });
  const verify = () =>
    run(async () => {
      await apiClient.post(`${base(jobId)}/verify`, { code });
      setStage("photos");
    });
  const checkIn = () =>
    run(async () => {
      await apiClient.post(`${base(jobId)}/complete`, { selfie_upload_id: photoIds.selfie, location_upload_id: photoIds.location });
      setStage("upload");
    });
  const onPhotoError = useCallback((m: string) => setError(m), []);
  const bothPhotos = !!photoIds.selfie && !!photoIds.location;

  return (
    <>
      <MHeader title={shoot.client} subtitle={SUB[stage]} back="/m" step={STEP[stage]} />
      <MMain>
        {stage === "start" && (
          <>
            <Card className="gap-3.5 p-[18px]">
              <div className="font-mono text-[13px]">{shoot.when}</div>
              <div className="text-sm leading-normal">
                <div className="flex items-start gap-1.5"><MapPin aria-hidden className="mt-0.5 size-4 flex-none text-mute" />{shoot.address}</div>
                {shoot.mapHref && (
                  <Link href={shoot.mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-info">
                    Open in Google Maps
                  </Link>
                )}
              </div>
              {shoot.contactPhone && (
                <div className="text-sm">
                  <div className="flex items-center gap-1.5 text-mute"><User aria-hidden className="size-4" /> On-site contact</div>
                  <Link href={`tel:${shoot.contactPhone}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-info">
                    <Phone aria-hidden className="size-4" /> Call {shoot.contactName ?? "the contact"}, {shoot.contactPhone}
                  </Link>
                </div>
              )}
              {shoot.brief && (
                <div className="rounded-[10px] bg-sub p-3 text-sm leading-normal whitespace-pre-line">
                  <strong>Brief.</strong> {shoot.brief}
                </div>
              )}
              <div className="font-mono text-xs text-mute">Job {shoot.code}</div>
            </Card>
            <p className="m-0 px-1 text-[13px] leading-normal text-mute2">Meet the client first. Then tap the button below. A code goes to the client&apos;s WhatsApp.</p>
            {dropOut && <div className="text-center">{dropOut}</div>}
          </>
        )}

        {stage === "otp" && (
          <>
            <Card className="gap-3.5 p-5">
              <h2 className="m-0 text-xl font-semibold">Ask the client for the code</h2>
              <p className="m-0 text-sm leading-normal text-mute2">
                We sent a 6-digit code to the client&apos;s WhatsApp{sentTo ? ` ${sentTo}` : ""}. The client, or the team member on site, reads it out.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label>Code</Label>
                <InputOTP maxLength={6} value={code} onChange={(v: string) => setCode(v.replace(/\D/g, ""))} aria-label="Check-in code" inputMode="numeric" autoComplete="one-time-code">
                  <InputOTP.Group>
                    {[0, 1, 2, 3, 4, 5].map((i) => <InputOTP.Slot key={i} index={i} />)}
                  </InputOTP.Group>
                </InputOTP>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-mute2">
                <Button size="sm" variant="ghost" className="px-0 text-info" isDisabled={busy || wait > 0 || sendsLeft <= 0} onPress={sendCode}>
                  {sendsLeft <= 0 ? "No more codes" : wait > 0 ? `Resend in 0:${String(wait).padStart(2, "0")}` : "Send again"}
                  {sendsLeft > 0 && ` (${sendsLeft} ${sendsLeft === 1 ? "send" : "sends"} left)`}
                </Button>
                <span>Valid for 10 minutes</span>
              </div>
            </Card>
            <div className="rounded-[10px] border border-dashed border-edge p-3 text-[13px] leading-normal text-mute2">
              No reply after 5 minutes? Call Operations. They can approve the check-in with a written reason.
            </div>
          </>
        )}

        {stage === "photos" && <LivePhotos jobId={jobId} ids={photoIds} onTaken={setPhotoIds} onError={onPhotoError} />}

        {stage === "upload" && <Uploads jobId={jobId} existing={files} />}

        {error && <Problem>{error}</Problem>}
      </MMain>

      <MFooter>
        {stage === "start" && (
          <Button fullWidth size="lg" className="min-h-14 text-[17px] font-bold" isPending={busy} onPress={sendCode}>Reached / About to start</Button>
        )}
        {stage === "otp" && (
          <Button fullWidth size="lg" className="min-h-14 text-[17px] font-bold" isDisabled={code.length !== 6} isPending={busy} onPress={verify}>Verify code</Button>
        )}
        {stage === "photos" && (
          <Button fullWidth size="lg" className="min-h-14 text-[17px] font-bold" isDisabled={!bothPhotos} isPending={busy} onPress={checkIn}>Check in and continue</Button>
        )}
        {stage === "upload" && <div className="text-center text-[13px] text-mute2">Operations sees client, date, time and place with every file.</div>}
      </MFooter>
    </>
  );
}

/** Two live photos from the camera. No gallery, no location data (as the mockup says). */
function LivePhotos({ jobId, ids, onTaken, onError }: {
  jobId: string; ids: { selfie?: string; location?: string }; onTaken: (ids: { selfie?: string; location?: string }) => void; onError: (m: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const which: "selfie" | "location" | null = !ids.selfie ? "selfie" : !ids.location ? "location" : null;
  const [busy, setBusy] = useState(false);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const ready = which !== null && readyFor === which;

  useEffect(() => {
    if (!which) return;
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
    if (!which || !v?.videoWidth) return;
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
      onTaken({ ...ids, [which]: upload_id });
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const shots = [
    { key: "selfie" as const, title: "Selfie with the client or the place", note: "Front camera" },
    { key: "location" as const, title: "Photo of the location", note: "Back camera" },
  ];

  return (
    <>
      <p className="m-0 text-sm leading-normal text-mute2">Take both photos now with the camera. The gallery is not offered. No location is read.</p>
      {shots.map((p) => {
        const done = !!ids[p.key];
        const active = which === p.key;
        return (
          <Card key={p.key} className="gap-3 p-3.5">
            <div className="flex items-center gap-3.5">
              <div className={`flex size-[84px] flex-none items-center justify-center rounded-[10px] ${done ? "bg-ok" : active ? "bg-rec" : "bg-[#9aa1ae]"}`}>
                {done ? <CheckCircle2 aria-hidden className="size-[30px] text-white" /> : <Camera aria-hidden className="size-[30px] text-white" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="text-[15px] font-semibold">{p.title}</div>
                <div className={`text-xs ${done ? "text-ok" : "text-mute"}`}>{done ? "Taken. Time stamped by the server." : p.note}</div>
              </div>
            </div>
            {active && (
              <>
                <video ref={video} autoPlay playsInline muted className={`aspect-[3/4] w-full rounded-[10px] bg-side object-cover ${p.key === "selfie" ? "-scale-x-100" : ""}`} />
                <Button fullWidth isDisabled={!ready} isPending={busy} onPress={shoot}>
                  <Camera aria-hidden className="size-4" /> {busy ? "Saving…" : "Take photo"}
                </Button>
              </>
            )}
          </Card>
        );
      })}
    </>
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
      key: `${kind}:${file.name}:${file.size}`,
      name: file.name,
      size: file.size,
      file,
      p: { sent: 0, total: file.size, state: "uploading" as const },
    }));
    setItems((xs) => [...xs.filter((x) => !list.some((l) => l.key === x.key)), ...list]);
    void start(list, kind);
  }

  const done = existing.filter((f) => f.status === "complete" && f.kind !== "proof");
  const pct = (p: Progress) => Math.floor((p.sent / Math.max(p.total, 1)) * 100);

  return (
    <>
      <ToggleButtonGroup
        aria-label="File type"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([kind])}
        onSelectionChange={(keys) => setKind(([...keys][0] as UploadKind) ?? "raw")}
        className="w-full"
      >
        <ToggleButton id="raw" className="flex-1">Raw files</ToggleButton>
        <ToggleButton id="edited" className="flex-1"><ToggleButtonGroup.Separator />Edited reels</ToggleButton>
      </ToggleButtonGroup>
      <div className="rounded-lg bg-warns px-3 py-2.5 text-[13px] font-medium text-warn">
        {kind === "raw" ? "Raw files are due 2 hours after the shoot ends." : "Edited reels are due the day after the shoot."}
      </div>
      {/* No `capture` attribute: the phone offers Photos / gallery. */}
      <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <Button fullWidth size="lg" variant="outline" className="min-h-14 border-2 border-dashed border-[#9aa1ae] text-[15px]" onPress={() => input.current?.click()}>
        <Upload aria-hidden className="size-5" /> Choose from Photos
      </Button>

      {items.map((u) => (
        <Card key={u.key} className="gap-2 rounded-xl px-3.5 py-3">
          <ProgressBar value={pct(u.p)} aria-label={u.name} size="sm" color={u.p.state === "done" ? "success" : u.p.state === "paused" ? "warning" : "accent"} className="gap-2">
            <div className="flex w-full justify-between gap-2 text-[13px]">
              <span className="truncate font-mono font-semibold">{u.name}</span>
              <span className={`font-semibold whitespace-nowrap ${u.p.state === "done" ? "text-ok" : u.p.state === "paused" ? "text-warn" : "text-ink"}`}>
                {u.p.state === "done" ? "Done" : u.p.state === "paused" ? "Paused" : `${pct(u.p)}%`}
              </span>
            </div>
            <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
          </ProgressBar>
          <div className="flex items-center justify-between gap-2 text-xs text-mute">
            <span>{fileSize(u.size)}</span>
            {u.p.state === "paused" && (
              <Button size="sm" variant="outline" onPress={() => void start([u], u.key.startsWith("edited") ? "edited" : "raw")}>
                <RotateCw aria-hidden className="size-3.5" /> Resume
              </Button>
            )}
          </div>
          {u.p.state === "paused" && <div className="text-xs text-warn">{u.p.error ?? "Connection dropped."}</div>}
        </Card>
      ))}
      {items.length > 0 && (
        <p className="m-0 text-xs leading-normal text-mute2">
          Screen stays awake while uploading. If the connection drops, open this job and pick the same file again. It continues where it stopped.
        </p>
      )}

      {done.length > 0 && (
        <Card className="gap-2 p-4">
          <h2 className="m-0 text-base font-semibold">Already uploaded</h2>
          {done.map((f) => (
            <div key={f.id} className="flex justify-between gap-2 border-b border-line2 py-1.5 text-sm last:border-0">
              <span className="truncate font-mono text-[13px]">{f.file_name}</span>
              <span className="whitespace-nowrap text-mute">{f.kind === "edited" ? "Edited" : "Raw"} · {fileSize(f.size_bytes)}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
