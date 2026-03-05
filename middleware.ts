import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth";

const LOGIN_PATH = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;
  const isLoggedIn = token && (await verifySessionToken(token));

  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado. Faça login." }, { status: 401 });
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
