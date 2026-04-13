import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicBadgesForUser } from "@/lib/trust/get-public-badges";

export const dynamic = "force-dynamic";

/**
 * GET /api/trust/profile/[userId] — public trust summary (badges + platform score).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!userId?.trim()) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const [profile, scoreRow, badges] = await Promise.all([
    prisma.userVerificationProfile.findUnique({ where: { userId } }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "user", entityId: userId } },
    }),
    getPublicBadgesForUser(userId),
  ]);

  return NextResponse.json({
    userId,
    verificationLevel: profile?.verificationLevel ?? "basic",
    emailVerified: profile?.emailVerified ?? false,
    phoneVerified: profile?.phoneVerified ?? false,
    identityVerified: profile?.identityVerified ?? false,
    brokerVerified: profile?.brokerVerified ?? false,
    paymentVerified: profile?.paymentVerified ?? false,
    trustScore: scoreRow?.score ?? null,
    trustLevel: scoreRow?.level ?? null,
    badges,
  });
}
