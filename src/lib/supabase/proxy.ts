import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { missingSupabaseEnv, supabaseEnv } from "@/lib/env";

const PUBLIC = ["/login", "/d/", "/auth/"];

/** Plain setup page shown on every route until the Supabase variables are set, instead of a stack trace. */
function missingEnvResponse(missing: string[]) {
  const items = missing.map((name) => `<li><code>${name}</code></li>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Setup needed</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem}code{background:#f1f1f1;padding:.1rem .3rem;border-radius:4px}</style>
</head><body><h1>Setup needed</h1><p>These environment variables are not set:</p><ul>${items}</ul>
<ol><li>In <code>reeload-server</code>, run <code>supabase start</code> and note the API URL and anon key.</li>
<li>Copy <code>.env.example</code> to <code>.env.local</code> and fill them in.</li>
<li>Restart <code>npm run dev</code>.</li></ol></body></html>`;
  return new NextResponse(html, { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

/** Refreshes the Supabase session cookie and sends signed-out visitors to /login. */
export async function updateSession(request: NextRequest) {
  if (missingSupabaseEnv.length > 0) return missingEnvResponse(missingSupabaseEnv);

  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && !PUBLIC.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}
