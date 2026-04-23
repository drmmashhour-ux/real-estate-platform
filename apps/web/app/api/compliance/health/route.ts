import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { normalizeHealthOwner } from "@/lib/compliance/health-owner";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const rawOwnerType = url.searchParams.get("ownerType") ?? "solo_broker";
  const rawOwnerId = url.searchParams.get("ownerId") ?? user.id;
  const scopeType = url.searchParams.get("scopeType") ?? "global";
  const scopeIdParam = url.searchParams.get("scopeId");

  const { ownerType, ownerId } = normalizeHealthOwner(rawOwnerType, rawOwnerId);

  if (user.role === PlatformRole.BROKER) {
    if (ownerType === "agency") {
      return NextResponse.json({ success: false, error: "Agency scope not available for this account" }, { status: 403 });
    }
    if (ownerType === "solo_broker" && ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const scopeId = scopeIdParam && scopeIdParam.trim() ? scopeIdParam.trim() : null;

  const [latestScore, riskEvents, anomalies] = await Promise.all([
    prisma.complianceScore.findFirst({
      where: {
        ownerType,
        ownerId,
        scopeType,
        scopeId,
      },
      orderBy: { lastComputedAt: "desc" },
    }),
    prisma.complianceRiskEvent.findMany({
      where: { ownerType, ownerId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.complianceAnomaly.findMany({
      where: { entityType: ownerType, entityId: ownerId },
      orderBy: { detectedAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    success: true,
    latestScore,
    riskEvents,
    anomalies,
  });
}
