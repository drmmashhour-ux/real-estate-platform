import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { BnhubFraudFlagStatus } from "@prisma/client";
import { reputationEngineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** Read-only snapshot for moderation dashboards — not a substitute for full fraud tools. */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  if (!reputationEngineFlags.reputationEngineV1) {
    return NextResponse.json({ error: "Reputation engine disabled" }, { status: 403 });
  }

  const openStatuses = [
    BnhubFraudFlagStatus.OPEN,
    BnhubFraudFlagStatus.UNDER_REVIEW,
    BnhubFraudFlagStatus.ESCALATED,
  ];

  const [openFlags, heldReviews] = await Promise.all([
    prisma.bnhubFraudFlag.count({ where: { status: { in: openStatuses } } }),
    prisma.review.count({ where: { moderationHeld: true } }),
  ]);

  const recent = await prisma.bnhubFraudFlag.findMany({
    where: { status: { in: openStatuses } },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: {
      id: true,
      listingId: true,
      hostUserId: true,
      status: true,
      severity: true,
      flagType: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    openBnhubFraudFlags: openFlags,
    reviewsHeldForModeration: heldReviews,
    recentFlags: recent,
  });
}
