import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { BnhubFraudFlagStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Minimal admin mobile queue — listing id + severity + safe summary only (no evidence). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const flags = await prisma.bnhubTrustRiskFlag.findMany({
    where: { flagStatus: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      listingId: true,
      flagType: true,
      severity: true,
      summary: true,
      createdAt: true,
    },
  });
  return Response.json({ flags });
}
