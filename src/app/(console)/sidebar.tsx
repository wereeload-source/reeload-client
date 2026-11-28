"use client";
import { Link } from "@heroui/react";
import { usePathname } from "next/navigation";
import { NAV, type NavKey } from "@/lib/nav";
import { NAV_ICON } from "./nav-icons";

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

/** Admin's left menu, as in the dashboard mockup. */
export function Sidebar({ items, badges }: { items: NavKey[]; badges: Partial<Record<NavKey, number>> }) {
  const path = usePathname();
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {items.map((k) => {
        const n = NAV[k];
        const Icon = NAV_ICON[k];
        const on = isActive(path, n.href);
        return (
          <li key={k}>
            <Link
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-[11px] text-sm font-medium no-underline transition-colors ${
                on ? "bg-side2 text-white" : "text-sidemute hover:bg-side3 hover:text-white"
              }`}
            >
              <Icon aria-hidden className="size-[18px]" strokeWidth={1.8} />
              <span className="flex-1">{n.label}</span>
              {!!badges[k] && <span className="font-mono text-xs text-[#f4b79f]">{badges[k]}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The top bar menu used by Sales, Operations and Accounts (as in their mockups). */
export function TopNav({ items }: { items: NavKey[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1">
      {items.map((k) => {
        const n = NAV[k];
        const on = isActive(path, n.href);
        return (
          <Link
            key={k}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3.5 text-sm no-underline transition-colors ${
              on ? "bg-side2 font-semibold text-white" : "font-medium text-sidemute hover:bg-side3 hover:text-white"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
