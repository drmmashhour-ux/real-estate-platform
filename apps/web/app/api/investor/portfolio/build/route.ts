import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { buildPortfolio, fetchFsboListingsForPortfolio, type PortfolioListing } from "@/lib/invest/portfolio";
import type { InvestorProfileInput } from "@/lib/invest/portfolio-types";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphInvestorFiltersEnabled } from "@/lib/trustgraph/feature-flags";
import { classifyVerifiedOpportunity } from "@/lib/trustgraph/infrastructure/services/verifiedOpportunityService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  const body = (await request.json().catch(() => null)) as {
    profile?: InvestorProfileInput;
    listingIds?: string[];
    /** Phase 5 TrustGraph — requires TRUSTGRAPH_INVESTOR_FILTERS_ENABLED */
    trustFilter?: "verified_opportunity" | "high_trust" | "complete_docs";
  } | null;
  if (!body?.profile) return NextResponse.json({ error: "profile required" }, { status: 400 });

  let listings: PortfolioListing[] = [];
  if (Array.isArray(body.listingIds) && body.listingIds.length > 0) {
    const rows = await prisma.fsboListing.findMany({
      where: {
        id: { in: body.listingIds.slice(0, 48) },
        status: "ACTIVE",
        moderationStatus: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        city: true,
        priceCents: true,
        bedrooms: true,
        bathrooms: true,
        surfaceSqft: true,
        coverImage: true,
        images: true,
      },
    });
    listings = rows.map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city,
      priceCents: r.priceCents,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      surfaceSqft: r.surfaceSqft,
      coverImage: r.coverImage,
      images: r.images,
    }));
  } else {
    listings = await fetchFsboListingsForPortfolio(prisma, 48);
  }

  if (
    body.trustFilter &&
    isTrustGraphEnabled() &&
    isTrustGraphInvestorFiltersEnabled() &&
    listings.length > 0
  ) {
    const ids = listings.map((l) => l.id);
    const cases = await prisma.verificationCase.findMany({
      where: { entityType: "LISTING", entityId: { in: ids } },
      orderBy: { updatedAt: "desc" },
      select: { entityId: true, overallScore: true, trustLevel: true, readinessLevel: true },
    });
    const latest = new Map<string, (typeof cases)[number]>();
    for (const row of cases) {
      if (!latest.has(row.entityId)) latest.set(row.entityId, row);
    }
    listings = listings
      .filter((l) => {
        const cl = classifyVerifiedOpportunity({ caseRow: latest.get(l.id) ?? null });
        if (body.trustFilter === "verified_opportunity") return cl.isVerifiedOpportunity;
        if (body.trustFilter === "high_trust") return cl.filterTags.some((t) => t.includes("High Trust"));
        if (body.trustFilter === "complete_docs") {
          return cl.filterTags.some((t) => t.includes("Complete Documentation"));
        }
        return true;
      })
      .slice(0, 48);
  }

  const result = await buildPortfolio(prisma, body.profile, listings);

  void prisma.toolUsageEvent
    .create({
      data: {
        toolKey: "investor_portfolio",
        eventType: "portfolio_built",
        userId: userId ?? undefined,
        payloadJson: { listingCount: listings.length },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ...result, label: "estimate" });
}
