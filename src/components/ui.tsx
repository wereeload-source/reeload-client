import { Chip as HeroChip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { initials, statusLabel } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

export type Tone = "ok" | "warn" | "rec" | "blue" | "vio";

/** Our tones on HeroUI's chip colours. */
const COLOR: Record<Tone, "success" | "warning" | "danger" | "accent" | "default"> = {
  ok: "success", warn: "warning", rec: "danger", blue: "accent", vio: "accent",
};

export function Chip({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <HeroChip size="sm" variant="soft" color={tone ? COLOR[tone] : "default"}>
      {children}
    </HeroChip>
  );
}

const STATUS_TONE: Partial<Record<JobStatus, Tone>> = {
  confirmed: "blue",
  assigned: "vio",
  accepted: "vio",
  reached: "warn",
  uploaded: "warn",
  released: "ok",
  paid: "ok",
  delivered: "ok",
  cancelled: "rec",
};

export function StatusChip({ status }: { status: string }) {
  return <Chip tone={STATUS_TONE[status as JobStatus]}>{statusLabel(status)}</Chip>;
}

const PALETTE = ["#e5372a", "#2449c9", "#137a46", "#6a3fc4", "#a15c00", "#0e7490", "#be185d", "#7c3aed"];

export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const c = PALETTE[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: c, fontSize: size * 0.42 }}
    >
      {initials(name)}
    </span>
  );
}

export function Kpi({ label, value, note, alert, icon: Icon }: { label: string; value: React.ReactNode; note?: string; alert?: boolean; icon?: LucideIcon }) {
  return (
    <div className="kpi">
      <div className="flex items-center gap-1.5 text-[13px] text-mute">
        {Icon && <Icon aria-hidden className="size-3.5" />}
        {label}
      </div>
      <div className={`my-1 whitespace-nowrap font-display text-[30px] font-bold tracking-tight tabular-nums ${alert ? "text-rec" : ""}`}>{value}</div>
      {note && <div className="text-[13px] text-mute">{note}</div>}
    </div>
  );
}

export function Empty({ children, icon: Icon }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="grid place-items-center gap-2 p-8 text-center text-mute">
      {Icon && <Icon aria-hidden className="size-6 opacity-60" />}
      <div>{children}</div>
    </div>
  );
}

/** A titled white panel. */
export function Panel({ title, icon: Icon, aside, children, flush }: {
  title?: string; icon?: LucideIcon; aside?: React.ReactNode; children: React.ReactNode; flush?: boolean;
}) {
  return (
    <section className={`box ${flush ? "px-2 py-1.5" : ""}`}>
      {title && (
        <h3 className={flush ? "px-2 pt-2" : ""}>
          {Icon && <Icon aria-hidden className="size-4 text-mute" />}
          {title}
          {aside && <span className="ml-auto text-[13px] font-medium text-mute">{aside}</span>}
        </h3>
      )}
      {children}
    </section>
  );
}
