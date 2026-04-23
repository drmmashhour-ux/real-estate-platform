import { NextResponse } from "next/server";
import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@repo/db";
import { getReputationBadges } from "@/lib/reputation/get-public-badges";

export const dynamic = "force-dynamic";

const ALLOWED: ReputationEntityType[] = ["host", "broker", "seller", "listing", "buyer"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const { entityType, entityId } = await params;
  const t = entityType as ReputationEntityType;
  if (!ALLOWED.includes(t) || !entityId?.trim()) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const [row, badges, recentReviews] = await Promise.all([
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType: t, entityId } },
    }),
    getReputationBadges(t, entityId),
    prisma.reputationReview.findMany({
      where: { subjectEntityType: t, subjectEntityId: entityId, status: "published" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, rating: true, title: true, body: true, createdAt: true, authorUserId: true },
    }),
  ]);

  return NextResponse.json({
    entityType: t,
    entityId,
    score: row?.score ?? null,
    level: row?.level ?? null,
    breakdown: row
      ? {
          reviewScore: row.reviewScore,
          reliabilityScore: row.reliabilityScore,
          responsivenessScore: row.responsivenessScore,
          complaintScore: row.complaintScore,
          qualityScore: row.qualityScore,
          reasonsJson: row.reasonsJson,
        }
      : null,
    badges,
    recentReviews,
  });
}
