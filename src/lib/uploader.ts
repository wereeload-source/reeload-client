"use client";
import { apiClient } from "@/lib/api-client";

// Resumable multipart upload straight to R2. The API keeps the multipart UploadId; picking the same
// file again asks R2 which parts already arrived and continues from there.

const MB = 1024 * 1024;
const MIN_PART = 8 * MB; // R2/S3 minimum is 5 MB (except the last part)
const MAX_PARTS = 10_000;

export type UploadKind = "raw" | "edited";
export interface Progress {
  sent: number;
  total: number;
  state: "uploading" | "paused" | "done" | "error";
  error?: string;
}
type Part = { PartNumber: number; ETag: string; Size: number };

export const partSize = (size: number) => Math.max(MIN_PART, Math.ceil(size / MAX_PARTS / MB) * MB);

function putPart(url: string, blob: Blob, onBytes: (n: number) => void, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      const etag = xhr.getResponseHeader("ETag");
      if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
      else reject(new Error(etag ? `Upload failed (${xhr.status})` : "Missing ETag: expose it in the R2 CORS rule"));
    };
    xhr.onerror = () => reject(new Error("Connection dropped"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}

export async function withRetry<T>(fn: () => Promise<T>, signal: AbortSignal, tries = 4, baseMs = 1000): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (signal.aborted || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
}

export async function uploadFile(opts: {
  jobId: string;
  kind: UploadKind;
  file: File;
  onBehalfOf?: string;
  onProgress: (p: Progress) => void;
  signal: AbortSignal;
}) {
  const { jobId, kind, file, onProgress, signal } = opts;
  const started = await apiClient.post<{ upload_id: string; parts: Part[] }>("/uploads", {
    job_id: jobId,
    kind,
    file_name: file.name,
    size_bytes: file.size,
    content_type: file.type || "application/octet-stream",
    on_behalf_of: opts.onBehalfOf ?? null,
  });
  const size = partSize(file.size);
  const count = Math.max(1, Math.ceil(file.size / size));
  const etags = new Map(started.parts.map((p) => [p.PartNumber, p.ETag]));
  let confirmed = started.parts.reduce((s, p) => s + p.Size, 0);
  onProgress({ sent: confirmed, total: file.size, state: "uploading" });

  for (let n = 1; n <= count; n++) {
    if (etags.has(n)) continue;
    const blob = file.slice((n - 1) * size, Math.min(n * size, file.size));
    const etag = await withRetry(async () => {
      const { url } = await apiClient.post<{ url: string }>(`/uploads/${started.upload_id}/sign-part`, { part_number: n });
      return putPart(url, blob, (b) => onProgress({ sent: confirmed + b, total: file.size, state: "uploading" }), signal);
    }, signal);
    etags.set(n, etag);
    confirmed += blob.size;
  }

  await apiClient.post(`/uploads/${started.upload_id}/complete`, {
    parts: [...etags].map(([PartNumber, ETag]) => ({ PartNumber, ETag })),
  });
  onProgress({ sent: file.size, total: file.size, state: "done" });
}

/** Keeps the phone screen on while uploading (Safari stops uploads when the phone sleeps). */
export async function keepAwake(): Promise<() => void> {
  try {
    const lock = await navigator.wakeLock?.request("screen");
    return () => void lock?.release();
  } catch {
    return () => {};
  }
}
