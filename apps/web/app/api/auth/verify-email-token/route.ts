import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * HTTP verification link (302 redirects) — reliable for email clients and non-RSC clients.
 * Marketing page `/auth/verify-email` remains as a thin redirect here for old links.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_token", origin));
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_token", origin));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return NextResponse.redirect(new URL("/auth/login?verified=1&next=/onboarding", origin));
}
