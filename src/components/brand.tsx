import { Play } from "lucide-react";

/** The Reeload mark from the mockups: an accent square with a play triangle, and the name. */
export function Brand({ small, onLight }: { small?: boolean; onLight?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${small ? "" : "px-2"}`}>
      <div className={`flex items-center justify-center rounded-lg bg-rec ${small ? "size-[30px]" : "size-8"}`}>
        <Play aria-hidden className={small ? "size-4" : "size-[18px]"} color="#fff" strokeWidth={2} strokeLinejoin="round" />
      </div>
      <span className={`font-display font-bold tracking-tight ${small ? "text-[19px]" : "text-xl"} ${onLight ? "text-ink" : "text-sideink"}`}>Reeload</span>
    </div>
  );
}
