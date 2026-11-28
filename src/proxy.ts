import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, PATH_HEADER, REFRESH_COOKIE, cookieOptions, needsRefresh, refreshSession } from "@/lib/token";

/** Open without a sign-in: the login page and the client download links. */
const PUBLIC = ["/login", "/d/"];

/**
 * Keeps people signed in and sends the rest to /login.
 *
 * Access tokens are short (15 minutes). When one is missing or about to expire and a refresh token is
 * present, this swaps them for a new pair before the page renders, so pages, server actions and the
 * /api/proxy route all see a fresh token. If the refresh fails, the cookies are cleared.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p));
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  const forward = new Headers(request.headers);
  forward.set(PATH_HEADER, path);

  if (!needsRefresh(access)) return NextResponse.next({ request: { headers: forward } });

  const pair = refresh ? await refreshSession(refresh) : null;
  if (pair) {
    // Pass the new tokens on to this request (so the page sees them) and to the browser (for next time).
    const headers = forward;
    const jar = request.cookies
      .getAll()
      .filter((c) => c.name !== ACCESS_COOKIE && c.name !== REFRESH_COOKIE)
      .map((c) => `${c.name}=${c.value}`);
    jar.push(`${ACCESS_COOKIE}=${pair.access_token}`, `${REFRESH_COOKIE}=${pair.refresh_token}`);
    headers.set("cookie", jar.join("; "));
    const res = NextResponse.next({ request: { headers } });
    res.cookies.set(ACCESS_COOKIE, pair.access_token, cookieOptions());
    res.cookies.set(REFRESH_COOKIE, pair.refresh_token, cookieOptions());
    return res;
  }

  if (isPublic) return NextResponse.next({ request: { headers: forward } });

  // The browser's own calls to the API get a plain 401 it can act on; pages get the login screen.
  if (path.startsWith("/api/")) return Response.json({ statusCode: 401, message: "Please sign in again" }, { status: 401 });
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", path);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
