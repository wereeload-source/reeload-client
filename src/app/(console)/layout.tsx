import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { NoticeBell } from "@/components/notice-bell";
import { UserMenu } from "@/components/user-menu";
import { canOpen, homeFor, mayOpenPath, menuFor } from "@/lib/nav";
import { api, requireProfile } from "@/lib/session";
import { PATH_HEADER } from "@/lib/token";
import type { Notifications } from "@/lib/types";
import { JobSearch } from "./job-search";
import { Sidebar, TopNav } from "./sidebar";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  if (me.role === "reelmaker") redirect("/m");
  // Pages outside this role's menu send it home here, before the page's loading screen starts streaming.
  const path = (await headers()).get(PATH_HEADER) ?? "";
  if (path && !mayOpenPath(me.role, path)) redirect(homeFor(me.role));
  const items = menuFor(me.role);
  // The unread count is a nice-to-have: a failure here must not take the whole console down.
  const unread = await api.get<Notifications>("/notifications?unread=true&limit=1").then((n) => n.unread, () => 0);
  const user = { full_name: me.full_name, email: me.email, role: me.role };

  // Admin: the dashboard mockup's left menu, with a header over the page. Everyone else: the top bar from their mockups.
  if (me.role === "admin") {
    return (
      <div className="flex min-h-dvh flex-col bg-bg md:flex-row">
        <aside
          aria-label="Main"
          className="flex flex-col gap-7 bg-side px-4 py-6 text-sideink print:hidden md:sticky md:top-0 md:h-dvh md:w-[248px] md:flex-none md:overflow-y-auto"
        >
          <Brand />
          <Sidebar items={items} badges={{}} />
          <p className="mt-auto px-3 text-xs leading-normal text-sidemute2">Full access · all prices. Every change is written to the audit log.</p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-line bg-paper/95 px-8 py-2 backdrop-blur print:hidden max-sm:px-4">
            {canOpen(me.role, "jobs") && <JobSearch />}
            <div className="ml-auto flex items-center gap-1">
              <NoticeBell unread={unread} />
              <UserMenu me={user} />
            </div>
          </header>
          <main className="flex min-w-0 flex-1 flex-col gap-6 px-8 py-7 max-sm:px-4">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-5 bg-side px-8 py-2 text-sideink print:hidden max-sm:px-4">
        <Brand small />
        <TopNav items={items} />
        <div className="ml-auto flex items-center gap-1">
          <NoticeBell unread={unread} dark />
          <UserMenu me={user} dark />
        </div>
      </header>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7 max-sm:px-4">{children}</main>
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
