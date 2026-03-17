import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setGuestIdCookie } from "@/lib/auth/session";

/** POST /api/auth/demo-session — Set session cookie for demo user (email). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const res = NextResponse.json({ ok: true, userId: user.id });
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
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}
