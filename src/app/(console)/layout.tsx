import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Avatar } from "@/components/ui";
import { menuFor } from "@/lib/nav";
import { api, requireProfile } from "@/lib/session";
import { ROLE_LABEL, type Notifications } from "@/lib/types";
import { Sidebar } from "./sidebar";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  if (me.role === "reelmaker") redirect("/m");
  const items = menuFor(me.role);
  // The bell count is a nice-to-have: a failure here must not take the whole console down.
  const unread = await api.get<Notifications>("/notifications?unread=true&limit=1").then((n) => n.unread, () => 0);

  return (
    <div className="grid min-h-dvh grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-dvh flex-col gap-1 bg-side px-3 py-4 text-sideink">
        <div className="flex items-center gap-2.5 px-2 pb-3.5 font-display text-[19px] font-bold tracking-tight text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/logo.svg" alt="" width={30} height={30} className="rounded-[9px] shadow-[0_0_0_3px_rgba(223,59,43,.18)]" /> Reeload
        </div>
        <Sidebar items={items} badges={{}} />
        <div className="mt-auto border-t border-[#22252a] pt-3">
          <div className="mb-1.5 ml-1 flex items-center justify-between text-[13px] text-[#5f646d]">
            Signed in as
            {unread > 0 && <span className="rounded-full bg-rec px-[7px] text-xs font-semibold text-white" title="Unread notices">{unread}</span>}
          </div>
          <div className="flex items-center gap-2 px-1">
            <Avatar name={me.full_name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{me.full_name}</div>
              <div className="text-xs text-sidemute">{ROLE_LABEL[me.role]}</div>
            </div>
          </div>
          <form action={signOut}>
            <button className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-sidemute hover:bg-side2 hover:text-white">
              <LogOut aria-hidden className="size-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex min-w-0 flex-col bg-sub">{children}</main>
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
