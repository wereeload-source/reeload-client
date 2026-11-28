import type { Money } from "@/lib/types";

const TZ = "Asia/Kolkata";

/** Money and counts arrive as numbers or strings like "15000.00". */
export const num = (v: Money | undefined): number => (v === null || v === undefined || v === "" ? 0 : Number(v));

export const inr = (n: Money | undefined) =>
  n === null || n === undefined || n === "" ? "—" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

export const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }) : "—";

export const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, day: "numeric", month: "short" }) : "—";

export const longDay = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "long" }) : "—";

/** "2026-11-28" for the Indian calendar day an instant falls on. */
export const istDate = (d: Date = new Date()) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export const isToday = (iso: string | null | undefined) => !!iso && istDate(new Date(iso)) === istDate();

export const hours = (minutes: number | null | undefined) => {
  const h = (minutes ?? 0) / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
};

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

export const statusLabel = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, " ");

export const fileSize = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.max(0.1, n / 1e6).toFixed(1)} MB`);

/** "2026-12-03" + "09:30" in Indian time -> ISO instant with offset, or null if either is missing. */
export const istInstant = (date: string, hhmm: string): string | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(hhmm) ? `${date}T${hhmm}:00+05:30` : null;
