const TZ = "Asia/Kolkata";

export const inr = (n: number | null | undefined) =>
  n == null ? "—" : "₹" + Math.round(Number(n)).toLocaleString("en-IN");

export const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }) : "—";

export const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, day: "numeric", month: "short" }) : "—";

export const isToday = (iso: string | null) =>
  !!iso && new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) === new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const hoursSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000) : 0);

export const initials = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
