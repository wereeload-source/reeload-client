"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, NavKey } from "@/lib/types";

export function Sidebar({ items, badges }: { items: NavKey[]; badges: Partial<Record<NavKey, number>> }) {
  const path = usePathname();
  return (
    <nav className="grid gap-0.5">
      {items.map((k, i) => {
        const n = NAV[k];
        // Show a group heading when this item starts a new group.
        const prev = items.slice(0, i).map((x) => NAV[x].group).filter(Boolean).at(-1);
        const showGroup = n.group && n.group !== prev;
        const on = path.startsWith(n.href);
        return (
          <div key={k}>
            {showGroup && <div className="px-2.5 pb-1 pt-3.5 text-xs text-[#5f646d]">{n.group}</div>}
            <Link
              href={n.href}
              className={`relative flex items-center gap-2.5 rounded-[7px] px-2.5 py-[7px] font-medium ${on ? "bg-side2 text-white shadow-[inset_0_0_0_1px_#2a2d33] before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-rec" : "text-sidemute hover:bg-side2 hover:text-white"}`}
            >
              {n.label}
              {!!badges[k] && <span className="ml-auto rounded-full bg-rec px-[7px] text-xs font-semibold text-white">{badges[k]}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
