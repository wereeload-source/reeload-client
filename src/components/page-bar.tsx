export function PageBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-paper px-6 py-3">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <span className="flex-1" />
      {children}
    </div>
  );
}

export function Pane({ children }: { children: React.ReactNode }) {
  return <div className="grid content-start gap-4 px-6 py-5">{children}</div>;
}
