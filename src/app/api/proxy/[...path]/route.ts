import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/session";

/**
 * Forwards browser calls to the API with the signed-in user's token added from the httpOnly cookie.
 * Only the path the browser asked for is forwarded, and only to API_URL.
 */
async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return Response.json({ statusCode: 401, message: "Please sign in again" }, { status: 401 });

  const target = `${API_URL()}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": req.headers.get("content-type") ?? "application/json" } : {}),
      },
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json({ statusCode: 503, message: "Cannot reach the server. Try again in a moment." }, { status: 503 });
  }

  const headers = new Headers();
  for (const h of ["content-type", "content-disposition"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
