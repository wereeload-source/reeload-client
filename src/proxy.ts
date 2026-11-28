import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/token";

const PUBLIC = ["/login", "/d/", "/api/"];

/** Is this a token that has not expired? The API still checks the signature on every call. */
function looksValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Sends visitors without a live login to /login (the sign-in page, client download links and the API proxy are open). */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (PUBLIC.some((p) => path.startsWith(p)) || looksValid(request.cookies.get(TOKEN_COOKIE)?.value)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
