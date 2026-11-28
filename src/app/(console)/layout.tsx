import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Brand } from "@/components/brand";
import { menuFor } from "@/lib/nav";
import { api, requireProfile } from "@/lib/session";
import { ROLE_LABEL, type Notifications } from "@/lib/types";
import { Sidebar, TopNav } from "./sidebar";

const ROLE_NOTE: Record<string, string> = {
  admin: "Full access · all prices",
  sales: "Clients, jobs and money",
  ops: "Prices hidden",
  accounts: "Payments and receipts",
};

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  if (me.role === "reelmaker") redirect("/m");
  const items = menuFor(me.role);
  // The unread count is a nice-to-have: a failure here must not take the whole console down.
  const unread = await api.get<Notifications>("/notifications?unread=true&limit=1").then((n) => n.unread, () => 0);

  const signOutButton = (dark: boolean) => (
    <form action={signOut}>
      <Button type="submit" size="sm" variant="ghost" className={dark ? "text-sidemute2 hover:bg-side2 hover:text-white" : ""}>
        <LogOut aria-hidden className="size-4" /> Sign out
      </Button>
    </form>
  );

  // Admin: the dashboard mockup's left menu. Everyone else: the top bar from their mockups.
  if (me.role === "admin") {
    return (
      <div className="flex min-h-dvh flex-col bg-bg md:flex-row">
        <aside
          aria-label="Main"
          className="flex flex-col gap-7 bg-side print:hidden px-4 py-6 text-sideink md:sticky md:top-0 md:h-dvh md:w-[248px] md:flex-none md:overflow-y-auto"
        >
          <Brand />
          <Sidebar items={items} badges={{}} />
          <div className="mt-auto flex flex-col gap-1 rounded-[10px] bg-side3 p-3">
            <div className="flex items-center justify-between text-xs text-sidemute2">
              Signed in as
              {unread > 0 && <span className="rounded-full bg-rec px-2 text-xs font-semibold text-white" title="Unread notices">{unread}</span>}
            </div>
            <div className="text-sm font-semibold">{me.full_name} ({ROLE_LABEL[me.role]})</div>
            <div className="text-xs text-sidemute2">{ROLE_NOTE[me.role]}</div>
            <div className="-ml-2 mt-1">{signOutButton(true)}</div>
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-8 py-7 max-sm:px-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex flex-wrap items-center gap-5 bg-side print:hidden px-8 py-3 text-sideink max-sm:px-4">
        <Brand small />
        <TopNav items={items} />
        <div className="ml-auto flex items-center gap-2 text-[13px] text-sidemute2">
          {unread > 0 && <span className="rounded-full bg-rec px-2 text-xs font-semibold text-white" title="Unread notices">{unread}</span>}
          <span>{me.full_name} · {ROLE_LABEL[me.role]}</span>
          {signOutButton(true)}
        </div>
      </header>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7 max-sm:px-4">{children}</main>
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
