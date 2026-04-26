import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET /api/ai/suggestions/pricing – list recent AI pricing suggestions. Mock-safe. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10) || 30));

    const items = await prisma.aiPricingRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json({
      suggestions: items.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        recommendedCents: r.recommendedCents,
        minCents: r.minCents,
        maxCents: r.maxCents,
        demandLevel: r.demandLevel,
        modelVersion: r.modelVersion,
        forDate: r.forDate,
        createdAt: r.createdAt,
      })),
    });
  } catch (_e) {
    return Response.json({ suggestions: [] });
  }
}
