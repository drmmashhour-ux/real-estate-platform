import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId, getUserRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const role = await getUserRole();
  if (role !== "BROKER") return NextResponse.json({ error: "Broker only" }, { status: 403 });

  try {
    const listings = await prisma.fsboListing.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const ids = listings.map((l) => l.id);
    const highProfiles = ids.length
      ? await prisma.propertyLegalProfile.findMany({
          where: {
            listingScope: "FSBO",
            listingId: { in: ids },
            latestRiskLevel: { in: ["HIGH", "CRITICAL"] },
          },
          select: { listingId: true, overallLegalRiskScore: true, latestRiskLevel: true },
        })
      : [];

    const logs = await prisma.brokerVerificationLog.count({
      where: { brokerUserId: userId },
    });

    const brokerAlerts = ids.length
      ? await prisma.legalAlert.count({
          where: {
            status: "OPEN",
            entityType: "LISTING_FSBO",
            entityId: { in: ids },
          },
        })
      : 0;

    return NextResponse.json({
      brokerProtectedHint: "Review verification logs and disclosure warnings to maintain protection status.",
      highRiskListings: highProfiles,
      verificationLogCount: logs,
      openAlertsApprox: brokerAlerts,
    });
  } catch (e) {
    console.error("GET /api/legal/broker/summary", e);
    return NextResponse.json(
      {
        brokerProtectedHint: "",
        highRiskListings: [],
        verificationLogCount: 0,
        openAlertsApprox: 0,
      },
      { status: 200 },
    );
  }
}
