import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * GET /api/fraud/listing/:id (id = listingId)
 * Returns fraud score, risk level, reasons, and alerts for the listing.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: listingId } = await context.params;
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const [score, alerts] = await Promise.all([
      prisma.propertyFraudScore.findUnique({
        where: { listingId },
      }),
      prisma.propertyFraudAlert.findMany({
        where: { listingId, status: "open" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return Response.json({
      listing_id: listingId,
      fraud_score: score?.fraudScore ?? null,
      risk_level: score?.riskLevel ?? null,
      reasons: (score?.reasons as Array<{ signal: string; points: number; detail?: string }>) ?? [],
      created_at: score?.createdAt ?? null,
      alerts: alerts.map((a) => ({
        id: a.id,
        alert_type: a.alertType,
        severity: a.severity,
        message: a.message,
        status: a.status,
        created_at: a.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get fraud data" },
      { status: 500 }
    );
  }
}
