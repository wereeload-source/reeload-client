import { Avatar as HeroAvatar, Card, Chip as HeroChip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { initials, statusLabel } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

/** The mockup's five pill tones (background / text). */
export type Tone = "ok" | "info" | "warn" | "bad" | "neutral";

export const TONE: Record<Tone, string> = {
  ok: "bg-oks text-ok",
  info: "bg-infos text-info",
  warn: "bg-warns text-warn",
  bad: "bg-bads text-bad",
  neutral: "bg-neutrals text-neutral",
};

/** A rounded status pill (HeroUI Chip in the mockup's colours). */
export function Chip({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <HeroChip size="sm" variant="soft" className={`rounded-full px-2.5 font-semibold whitespace-nowrap ${TONE[tone]} ${className}`}>
      {children}
    </HeroChip>
  );
}

const STATUS_TONE: Record<JobStatus, Tone> = {
  lead: "neutral",
  draft: "neutral",
  confirmed: "info",
  assigned: "warn",
  accepted: "ok",
  reached: "info",
  uploaded: "info",
  released: "ok",
  paid: "ok",
  delivered: "ok",
  closed: "neutral",
  cancelled: "bad",
};

const STATUS_TEXT: Partial<Record<JobStatus, string>> = { assigned: "Awaiting accept" };

export function StatusChip({ status }: { status: string }) {
  return <Chip tone={STATUS_TONE[status as JobStatus] ?? "neutral"}>{STATUS_TEXT[status as JobStatus] ?? statusLabel(status)}</Chip>;
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <HeroAvatar size={size} color="accent" variant="soft" aria-hidden>
      <HeroAvatar.Fallback>{initials(name)}</HeroAvatar.Fallback>
    </HeroAvatar>
  );
}

const NOTE_TONE: Record<Tone, string> = { ok: "text-ok", info: "text-info", warn: "text-warn", bad: "text-bad", neutral: "text-mute2" };

/** A key number card: label, big value, coloured note. */
export function Kpi({ label, value, note, tone = "neutral" }: { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: Tone }) {
  return (
    <Card className="gap-2 px-5 py-[18px]">
      <div className="text-[13px] font-medium text-mute">{label}</div>
      <div className="font-display text-[34px] font-bold leading-none tracking-tight whitespace-nowrap">{value}</div>
      {note && <div className={`text-[13px] font-medium ${NOTE_TONE[tone]}`}>{note}</div>}
    </Card>
  );
}

export function Kpis({ children }: { children: React.ReactNode }) {
  return <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">{children}</section>;
}

export function Empty({ children, icon: Icon }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-8 text-center text-sm text-mute">
      {Icon && <Icon aria-hidden className="size-6 opacity-60" />}
      <div>{children}</div>
    </div>
  );
}

/** A white card with a Space Grotesk title and an optional link or note on the right. */
export function Panel({ title, icon: Icon, aside, children, className = "" }: {
  title?: React.ReactNode; icon?: LucideIcon; aside?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <Card className={`min-w-0 gap-3 px-[22px] py-5 ${className}`}>
      {title && (
        <Card.Header className="flex-row items-baseline justify-between gap-3">
          <Card.Title className="flex items-center gap-2 font-display text-lg font-semibold leading-tight">
            {Icon && <Icon aria-hidden className="size-[18px] text-mute" />}
            {title}
          </Card.Title>
          {aside && <div className="text-[13px] font-semibold text-mute">{aside}</div>}
        </Card.Header>
      )}
      <Card.Content className="min-w-0 gap-3">{children}</Card.Content>
    </Card>
  );
}

/** Labelled facts in a grid (When / Where / On-site contact). */
export function Facts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 text-sm">
      {items.map((f) => (
        <div key={f.label}>
          <dt className="text-xs font-semibold text-mute">{f.label}</dt>
          <dd className="m-0 mt-0.5">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
