import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET /api/ai/fraud-alerts – list high-risk fraud scores and property fraud alerts. Mock-safe. */
export async function GET() {
  try {
    const [scores, alerts] = await Promise.all([
      prisma.propertyFraudScore.findMany({
        where: {
          OR: [{ riskLevel: "high" }, { fraudScore: { gte: 50 } }],
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              listingStatus: true,
            },
          },
        },
        orderBy: { fraudScore: "desc" },
        take: 50,
      }),
      prisma.propertyFraudAlert.findMany({
        where: { status: "open" },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const alertsList = [
      ...scores.map((s) => ({
        id: s.id,
        type: "score" as const,
        listingId: s.listingId,
        listing: s.listing,
        fraudScore: s.fraudScore,
        riskLevel: s.riskLevel,
        reasons: s.reasons,
        createdAt: s.createdAt,
      })),
      ...alerts.map((a) => ({
        id: a.id,
        type: "alert" as const,
        listingId: a.listingId,
        listing: a.listing,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        status: a.status,
        createdAt: a.createdAt,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Response.json({ alerts: alertsList.slice(0, 50) });
  } catch (_e) {
    return Response.json({ alerts: [] });
  }
}
