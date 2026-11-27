"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/m", label: "Shoots" },
  { href: "/m/hours", label: "Hours" },
];

export function Tabs() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-[480px] grid-cols-2 border-t border-line bg-paper/80 px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur-md">
      {TABS.map((t) => {
        const on = t.href === "/m" ? path === "/m" || path.startsWith("/m/shoots") : path.startsWith(t.href);
        return <Link key={t.href} href={t.href} className={`p-2 text-center text-xs font-semibold ${on ? "text-rec" : "text-mute"}`}>{t.label}</Link>;
      })}
    </nav>
  );
}
