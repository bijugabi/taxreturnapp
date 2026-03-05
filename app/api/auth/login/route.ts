import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, verifyPassword } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("id, salt, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Login DB error:", error);
      return NextResponse.json(
        { error: "Erro ao verificar credenciais." },
        { status: 500 }
      );
    }

    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    const cookieName = getSessionCookieName();
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Erro ao fazer login." },
      { status: 500 }
    );
  }
}
