"use client";
import { Clapperboard, Clock3, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const TABS = [
  { href: "/m", label: "Shoots", icon: Clapperboard },
  { href: "/m/hours", label: "Hours", icon: Clock3 },
];

export function Tabs() {
  const path = usePathname();
  return (
    <nav aria-label="Reelmaker" className="fixed inset-x-0 bottom-0 mx-auto grid max-w-[480px] grid-cols-3 border-t border-line bg-paper/80 px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur-md">
      {TABS.map((t) => {
        const on = t.href === "/m" ? path === "/m" || path.startsWith("/m/shoots") : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={`grid place-items-center gap-0.5 p-2 text-xs font-semibold ${on ? "text-rec" : "text-mute"}`}>
            <t.icon aria-hidden className="size-5" />
            {t.label}
          </Link>
        );
      })}
      <form action={signOut} className="contents">
        <button className="grid place-items-center gap-0.5 p-2 text-xs font-semibold text-mute">
          <LogOut aria-hidden className="size-5" />
          Sign out
        </button>
      </form>
    </nav>
  );
}
