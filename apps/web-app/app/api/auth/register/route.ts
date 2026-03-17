import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setGuestIdCookie } from "@/lib/auth/session";
import type { PlatformRole } from "@prisma/client";

/** POST /api/auth/register — Create account and set session. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = typeof body?.password === "string" ? body.password : null;
    const name = typeof body?.name === "string" ? body.name.trim() : null;
    const role = body?.role as PlatformRole | undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const validRole = role && ["USER", "OWNER_HOST", "LICENSED_PROFESSIONAL", "INVESTOR"].includes(role) ? role : "USER";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: validRole,
      },
    });

    const res = NextResponse.json({ ok: true, userId: user.id, email: user.email });
    const cookie = setGuestIdCookie(user.id);
    res.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
