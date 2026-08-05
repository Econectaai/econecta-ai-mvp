import { NextResponse } from "next/server";
import { createToken, COOKIE_NAME, COOKIE_MAX_AGE } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();

    const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim();
    const sessionSecret = process.env.SESSION_SECRET;

    // Diagnostic — lengths only, never values
    console.log("[auth/login] secret check:", {
      ADMIN_EMAIL_exists: !!process.env.ADMIN_EMAIL,
      ADMIN_EMAIL_len: adminEmail.length,
      ADMIN_PASSWORD_exists: !!process.env.ADMIN_PASSWORD,
      ADMIN_PASSWORD_len: adminPassword.length,
      SESSION_SECRET_exists: !!sessionSecret,
      submitted_email_len: email.length,
      submitted_password_len: password.length,
    });

    if (!adminEmail || !adminPassword || !sessionSecret) {
      return NextResponse.json(
        { error: "Servidor não configurado corretamente." },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const token = await createToken(sessionSecret);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 }
    );
  }
}
