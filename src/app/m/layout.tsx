import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/server";
import { Tabs } from "./tabs";

// Reelmaker web app: phone-first, used in Safari or Chrome, installable to the home screen.
export default async function ReelmakerLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  if (me.role !== "reelmaker" && me.role !== "admin") redirect("/");
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-paper">
      <div className="flex-1 overflow-auto px-4 pb-24 pt-[max(env(safe-area-inset-top),12px)]">{children}</div>
      <Tabs />
    </div>
  );
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
