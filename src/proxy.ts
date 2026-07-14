import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/learn", "/course", "/settings"];
const authPages = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("better-auth.session"));

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!hasSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (authPages.includes(pathname) && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/learn/:path*",
    "/course/:path*",
    "/settings",
    "/sign-in",
    "/sign-up",
  ],
};
