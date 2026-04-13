import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampRepScore } from "@/lib/reputation/validators";

function photoCount(photos: unknown): number {
  if (!Array.isArray(photos)) return 0;
  return photos.filter((x): x is string => typeof x === "string").length;
}

/** Content / operational quality signals → 0–100 */
export async function computeQualityScoreComponent(
  entityType: ReputationEntityType,
  entityId: string
): Promise<{ score: number; detail: Record<string, unknown> }> {
  if (entityType === "listing") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: entityId },
      select: { description: true, photos: true, amenities: true, instantBookEnabled: true },
    });
    if (!l) return { score: 40, detail: { error: "not_found" } };
    const desc = (l.description ?? "").trim().length;
    const descS = desc >= 500 ? 1 : desc >= 120 ? 0.75 : desc >= 40 ? 0.5 : 0.3;
    const pc = Math.min(1, photoCount(l.photos) / 8);
    const am = Array.isArray(l.amenities) ? Math.min(1, l.amenities.length / 12) : 0;
    const inst = l.instantBookEnabled ? 0.08 : 0;
    const raw = 0.38 * descS + 0.38 * pc + 0.22 * am + inst;
    return { score: clampRepScore(raw * 100), detail: { descLen: desc, photoCount: photoCount(l.photos) } };
  }

  if (entityType === "broker") {
    const [leads, act] = await Promise.all([
      prisma.brokerLead.count({ where: { brokerId: entityId } }),
      prisma.brokerActivityScore.findUnique({ where: { brokerId: entityId } }),
    ]);
    const vol = Math.min(1, Math.log1p(leads) / Math.log1p(80));
    const risk = act ? Math.max(0, 1 - act.riskScore / 120) : 0.7;
    return {
      score: clampRepScore(vol * 55 + risk * 35 + 10),
      detail: { leadCount: leads, activityRisk: act?.riskScore ?? null },
    };
  }

  if (entityType === "host" || entityType === "seller") {
    const n = await prisma.shortTermListing.count({
      where: { ownerId: entityId, listingStatus: "PUBLISHED" },
    });
    return {
      score: clampRepScore(52 + Math.min(35, n * 3)),
      detail: { publishedListings: n },
    };
  }

  return { score: 55, detail: { source: "default" } };
}
