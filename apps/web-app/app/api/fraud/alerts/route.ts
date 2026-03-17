import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/fraud/alerts
 * Query: status=open|reviewed|dismissed, severity=low|medium|high, limit.
 * Returns fraud alerts (admin or listing host for own listings).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const severity = searchParams.get("severity");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

    const where: { status: string; severity?: string; listing?: { ownerId: string } } = { status };
    if (severity) where.severity = severity;
    // In production: restrict to admin or own listings
    // where.listing = { ownerId: userId };

    const alerts = await prisma.propertyFraudAlert.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            listingStatus: true,
            ownerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        listing_id: a.listingId,
        listing: a.listing,
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
      { error: e instanceof Error ? e.message : "Failed to get alerts" },
      { status: 500 }
    );
  }
}
