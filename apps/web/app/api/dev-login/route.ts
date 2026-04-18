import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";

/**
 * DEV ONLY — auto session for growth dashboard validation.
 * Production: route returns 404 (NODE_ENV !== "development").
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const explicitId = process.env.DEV_LOGIN_USER_ID?.trim();
  let admin: { id: string; role: PlatformRole } | null = null;
  if (explicitId) {
    const u = await prisma.user.findUnique({
      where: { id: explicitId },
      select: { id: true, role: true },
    });
    admin = u?.role === PlatformRole.ADMIN ? u : null;
  } else {
    admin = await prisma.user.findFirst({
      where: { role: PlatformRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true },
    });
  }
  if (!admin) {
    return NextResponse.json(
      { error: "No ADMIN user in database — create one for local validation." },
      { status: 503 }
    );
  }

  const token = await createDbSession(admin.id);
  const dest = new URL("/en/ca/dashboard/growth", request.url);
  const res = NextResponse.redirect(dest);

  const c = setGuestIdCookie(token);
  res.cookies.set(c.name, c.value, {
    path: c.path,
    maxAge: c.maxAge,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  });

  const roleCk = setUserRoleCookie(admin.role);
  res.cookies.set(roleCk.name, roleCk.value, {
    path: roleCk.path,
    maxAge: roleCk.maxAge,
    httpOnly: roleCk.httpOnly,
    secure: roleCk.secure,
    sameSite: roleCk.sameSite,
  });

  return res;
}
