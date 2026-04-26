import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import {
  loadRecommendationContext,
  parseBoolParam,
} from "@/modules/personalized-recommendations";
import { loadFsboMetricsMap, scoreFsboBuyerSync } from "@/modules/personalized-recommendations";
import { buildUserSafeExplanation } from "@/modules/personalized-recommendations/recommendation-explainability";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") ?? "12", 10) || 12, 60);
  const personalization = parseBoolParam(sp.get("personalization"), true);
  const city = sp.get("city")?.trim() || null;
  const marketSegment = sp.get("marketSegment")?.trim() || null;
  const idsRaw = sp.get("ids")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  const userId = await getGuestId();
  const ctx = await loadRecommendationContext(userId);
  const applyPersonalization = personalization && ctx.personalizationEnabled;

  const coldStart =
    !userId ||
    !applyPersonalization ||
    (ctx.viewedFsboIds.length === 0 && ctx.savedFsboIds.length === 0 && Object.keys(ctx.cityWeights).length === 0);

  let listings =
    idsRaw.length > 0 ?
      await prisma.fsboListing.findMany({
        where: {
          id: { in: idsRaw },
          ...buildFsboPublicVisibilityWhere(),
        },
        select: {
          id: true,
          title: true,
          city: true,
          propertyType: true,
          priceCents: true,
          createdAt: true,
          coverImage: true,
          lecipmGreenVerificationLevel: true,
        },
      })
    : await prisma.fsboListing.findMany({
        where: {
          ...buildFsboPublicVisibilityWhere(),
          ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
          ...(marketSegment ?
            { propertyType: { contains: marketSegment, mode: "insensitive" } }
          : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 80,
        select: {
          id: true,
          title: true,
          city: true,
          propertyType: true,
          priceCents: true,
          createdAt: true,
          coverImage: true,
          lecipmGreenVerificationLevel: true,
        },
      });

  const metrics = await loadFsboMetricsMap(listings.map((l) => l.id));
  const scored = listings.map((l) => {
    const mr = metrics.get(l.id) ?? 0.35;
    const { score, factors } = scoreFsboBuyerSync({
      listing: l,
      ctx,
      personalization: applyPersonalization,
      marketRank01: mr,
    });
    return {
      entityType: "FSBO_LISTING" as const,
      entityId: l.id,
      score,
      confidence: coldStart ? 52 : 66,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "BUYER", coldStart }),
      title: l.title,
      subtitle: `${l.city} · ${(l.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}`,
      href: buildFsboPublicListingPath({ id: l.id, city: l.city, propertyType: l.propertyType }),
      imageUrl: l.coverImage,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return NextResponse.json({
    items: scored.slice(0, limit),
    personalizationApplied: applyPersonalization,
    coldStart,
    privacyNote:
      "Rankings use optional personalization when enabled. Not a valuation or investment recommendation.",
  });
}
