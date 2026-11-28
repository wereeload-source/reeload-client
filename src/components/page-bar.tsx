/** Page heading as in the mockup: small grey line above, 30px Space Grotesk title, actions on the right. */
export function PageBar({ title, eyebrow, note, children }: { title: string; eyebrow?: React.ReactNode; note?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="text-[13px] font-medium text-mute">{eyebrow}</div>}
        <h1 className={`${eyebrow ? "mt-1" : ""} m-0 text-[30px] font-bold leading-tight tracking-tight`}>{title}</h1>
      </div>
      {(children || note) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {note && <div className="max-w-md text-[13px] text-mute">{note}</div>}
          {children}
        </div>
      )}
    </header>
  );
}

export function Pane({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}
