import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

function clearSession(response: NextResponse) {
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  clearSession(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSession(response);
  return response;
}
