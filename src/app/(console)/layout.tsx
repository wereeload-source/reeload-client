import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { ROLE_LABEL, ROLE_NAV } from "@/lib/types";
import { Avatar } from "@/components/ui";
import { signOut } from "@/app/login/actions";
import { Sidebar } from "./sidebar";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  if (me.role === "reelmaker") redirect("/m");
  const items = ROLE_NAV[me.role];

  return (
    <div className="grid min-h-dvh grid-cols-[220px_minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-dvh flex-col gap-1 bg-side px-3 py-4 text-sideink">
        <div className="flex items-center gap-2.5 px-2 pb-3.5 font-display text-[19px] font-bold tracking-tight text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/logo.svg" alt="" width={30} height={30} className="rounded-[9px] shadow-[0_0_0_3px_rgba(223,59,43,.18)]" /> ReelOps
        </div>
        <Sidebar items={items} badges={{}} />
        <div className="mt-auto border-t border-[#22252a] pt-3">
          <div className="mb-1.5 ml-1 text-[13px] text-[#5f646d]">Signed in as</div>
          <div className="flex items-center gap-2 px-1">
            <Avatar name={me.full_name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{me.full_name}</div>
              <div className="text-xs text-sidemute">{ROLE_LABEL[me.role]}</div>
            </div>
          </div>
          <form action={signOut}><button className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-[13px] text-sidemute hover:bg-side2 hover:text-white">Sign out</button></form>
        </div>
      </aside>
      <main className="flex min-w-0 flex-col bg-sub">{children}</main>
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
