import { initials, statusLabel } from "@/lib/format";

const CHIP: Record<string, string> = {
  confirmed: "bg-blues text-blue",
  assigned: "bg-vios text-vio",
  accepted: "bg-vios text-vio",
  reached: "bg-warns text-warn",
  uploaded: "bg-warns text-warn",
  released: "bg-oks text-ok",
  paid: "bg-oks text-ok",
  delivered: "bg-oks text-ok",
};

const TONE = { ok: "bg-oks text-ok", warn: "bg-warns text-warn", rec: "bg-recs text-rec", blue: "bg-blues text-blue", vio: "bg-vios text-vio" };

export function Chip({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "rec" | "blue" | "vio" }) {
  const t = tone ? TONE[tone] : "bg-sub text-mute";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-[7px] py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-[5px] px-[7px] py-0.5 text-xs font-medium ${CHIP[status] ?? "bg-sub text-mute"}`}>
      {statusLabel(status)}
    </span>
  );
}

const PALETTE = ["#e5372a", "#2449c9", "#137a46", "#6a3fc4", "#a15c00", "#0e7490", "#be185d", "#7c3aed"];
export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const c = PALETTE[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span className="grid flex-none place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: c, fontSize: size * 0.42 }}>
      {initials(name)}
    </span>
  );
}

export function Kpi({ label, value, note, alert }: { label: string; value: React.ReactNode; note?: string; alert?: boolean }) {
  return (
    <div className="kpi">
      <div className="text-[13px] text-mute">{label}</div>
      <div className={`my-1 whitespace-nowrap font-display text-[30px] font-bold tracking-tight tabular-nums ${alert ? "text-rec" : ""}`}>{value}</div>
      {note && <div className="text-[13px] text-mute">{note}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-8 text-center text-mute">{children}</div>;
}
