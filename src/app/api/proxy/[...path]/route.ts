import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, API_URL } from "@/lib/token";

const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;
const MAX_BODY_BYTES = 1_000_000; // JSON only: files go straight to R2, never through here.

const fail = (status: number, message: string) => Response.json({ statusCode: status, message }, { status });

/** A write must come from this app's own pages (defence in depth on top of SameSite=Lax cookies). */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  return origin === req.nextUrl.origin;
}

/**
 * Forwards browser calls to the API with the signed-in user's token added from the httpOnly cookie.
 * Only the path the browser asked for is forwarded, and only to API_URL. The API decides what each
 * role may do; this route only adds the token.
 */
async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path.length || path.some((p) => p === "." || p === ".." || !SAFE_SEGMENT.test(p))) return fail(400, "Bad path");

  const hasBody = !["GET", "HEAD"].includes(req.method);
  if (hasBody && !sameOrigin(req)) return fail(403, "Cross-site request refused");

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return fail(401, "Please sign in again");

  let body: string | undefined;
  if (hasBody) {
    body = await req.text();
    if (body.length > MAX_BODY_BYTES) return fail(413, "That request is too large");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL()}/${path.join("/")}${req.nextUrl.search}`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return fail(503, "Cannot reach the server. Try again in a moment.");
  }

  const headers = new Headers({ "cache-control": "no-store" });
  for (const h of ["content-type", "content-disposition"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
