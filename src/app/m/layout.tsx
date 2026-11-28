import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";

// Reelmaker web app: phone-first, used in Safari or Chrome, installable to the home screen.
export default async function ReelmakerLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireProfile();
  // Only reelmakers have shoots of their own; the API refuses everyone else on these routes.
  if (me.role !== "reelmaker") redirect("/");
  return <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-bg">{children}</div>;
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
