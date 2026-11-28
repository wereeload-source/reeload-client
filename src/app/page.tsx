import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { homeFor } from "@/lib/types";

export default async function Home() {
  const { me } = await requireProfile();
  redirect(homeFor(me.role));
}

// Every screen reads the signed-in session or a per-request token, so it renders on each request.
export const instant = false;
