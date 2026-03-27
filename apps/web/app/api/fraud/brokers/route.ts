import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/fraud/brokers
 * Returns broker activity scores (suspicious broker monitoring). Admin-oriented.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minRisk = Number(searchParams.get("min_risk")) || 0;
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const brokers = await prisma.brokerActivityScore.findMany({
      where: { riskScore: { gte: minRisk } },
      include: {
        broker: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { riskScore: "desc" },
      take: limit,
    });

    return Response.json({
      brokers: brokers.map((b) => ({
        broker_id: b.brokerId,
        broker: b.broker,
        listing_count: b.listingCount,
        fraud_flags: b.fraudFlags,
        risk_score: b.riskScore,
        updated_at: b.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to get brokers" },
      { status: 500 }
    );
  }
}
