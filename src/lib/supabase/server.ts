import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/** The signed-in user's profile, or a redirect to /login. */
export async function requireProfile(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; me: Profile }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!me || !me.active) redirect("/login?disabled=1");
  return { supabase, me: me as Profile };
}
