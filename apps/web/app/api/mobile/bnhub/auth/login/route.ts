import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { verifyPassword } from "@/lib/auth/password";
import { createDbSession } from "@/lib/auth/db-session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        homeCity: true,
        homeRegion: true,
        homeCountry: true,
        createdAt: true,
        emailVerifiedAt: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "Please confirm your email before signing in." }, { status: 403 });
    }

    const sessionToken = await createDbSession(user.id);

    return NextResponse.json({
      ok: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        homeCity: user.homeCity,
        homeRegion: user.homeRegion,
        homeCountry: user.homeCountry,
        createdAt: user.createdAt.toISOString(),
        unreadReservationNotifications: 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
