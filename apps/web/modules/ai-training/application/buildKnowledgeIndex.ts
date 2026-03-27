import type { PrismaClient } from "@prisma/client";

function compactText(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" | ")
    .slice(0, 6000);
}

/**
 * Build/update retrievable Copilot memory from platform data.
 * Deterministic summaries only.
 */
export async function buildKnowledgeIndex(db: PrismaClient, args: { userId?: string; workspaceId?: string } = {}) {
  if (!args.userId) {
    throw new Error("userId is required to build knowledge index");
  }
  const [listings, leads, blogPosts, markets] = await Promise.all([
    db.fsboListing.findMany({
      take: 200,
      orderBy: { updatedAt: "desc" },
      select: { id: true, city: true, address: true, title: true, trustScore: true, propertyType: true, updatedAt: true },
    }),
    db.lead.findMany({
      take: 250,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        fsboListingId: true,
        lecipmLeadScore: true,
        lecipmDealQualityScore: true,
        lecipmTrustScore: true,
        lecipmCrmStage: true,
        engagementScore: true,
        purchaseRegion: true,
      },
    }),
    db.seoBlogPost.findMany({
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: { slug: true, title: true, excerpt: true, city: true, keywords: true, updatedAt: true },
    }),
    db.marketDataPoint.findMany({
      take: 300,
      orderBy: { date: "desc" },
      select: { city: true, propertyType: true, avgPriceCents: true, avgRentCents: true, date: true },
    }),
  ]);

  for (const l of listings) {
    await db.copilotMemoryItem.upsert({
      where: { id: `${l.id}-listing-memory` },
      create: {
        id: `${l.id}-listing-memory`,
        userId: args.userId,
        workspaceId: args.workspaceId ?? null,
        memoryType: "listing_summary",
        key: l.id,
        listingId: l.id,
        city: l.city,
        propertyType: l.propertyType ?? null,
        content: compactText([
          l.title,
          l.address,
          l.city,
          `trust_score:${l.trustScore ?? "n/a"}`,
          `property_type:${l.propertyType ?? "n/a"}`,
        ]),
        metadata: { updatedAt: l.updatedAt.toISOString() } as object,
      },
      update: {
        city: l.city,
        propertyType: l.propertyType ?? null,
        content: compactText([
          l.title,
          l.address,
          l.city,
          `trust_score:${l.trustScore ?? "n/a"}`,
          `property_type:${l.propertyType ?? "n/a"}`,
        ]),
        metadata: { updatedAt: l.updatedAt.toISOString() } as object,
      },
    });
  }

  for (const lead of leads) {
    await db.copilotMemoryItem.upsert({
      where: { id: `${lead.id}-lead-memory` },
      create: {
        id: `${lead.id}-lead-memory`,
        userId: args.userId,
        workspaceId: args.workspaceId ?? null,
        memoryType: "crm_lead_summary",
        key: lead.id,
        listingId: lead.fsboListingId ?? null,
        city: lead.purchaseRegion ?? null,
        content: compactText([
          `lead:${lead.name}`,
          `stage:${lead.lecipmCrmStage ?? "new_lead"}`,
          `lead_score:${lead.lecipmLeadScore ?? "n/a"}`,
          `deal_score:${lead.lecipmDealQualityScore ?? "n/a"}`,
          `trust_score:${lead.lecipmTrustScore ?? "n/a"}`,
          `engagement:${lead.engagementScore}`,
        ]),
        metadata: {
          leadId: lead.id,
          fsboListingId: lead.fsboListingId,
        } as object,
      },
      update: {
        listingId: lead.fsboListingId ?? null,
        city: lead.purchaseRegion ?? null,
        content: compactText([
          `lead:${lead.name}`,
          `stage:${lead.lecipmCrmStage ?? "new_lead"}`,
          `lead_score:${lead.lecipmLeadScore ?? "n/a"}`,
          `deal_score:${lead.lecipmDealQualityScore ?? "n/a"}`,
          `trust_score:${lead.lecipmTrustScore ?? "n/a"}`,
          `engagement:${lead.engagementScore}`,
        ]),
        metadata: {
          leadId: lead.id,
          fsboListingId: lead.fsboListingId,
        } as object,
      },
    });
  }

  for (const p of blogPosts) {
    await db.copilotMemoryItem.upsert({
      where: { id: `seo-blog-${p.slug}` },
      create: {
        id: `seo-blog-${p.slug}`,
        userId: args.userId,
        workspaceId: args.workspaceId ?? null,
        memoryType: "seo_blog_summary",
        key: p.slug,
        city: p.city ?? null,
        content: compactText([p.title, p.excerpt ?? "", `keywords:${p.keywords.join(",")}`]),
        metadata: { slug: p.slug, city: p.city, keywords: p.keywords } as object,
      },
      update: {
        city: p.city ?? null,
        content: compactText([p.title, p.excerpt ?? "", `keywords:${p.keywords.join(",")}`]),
        metadata: { slug: p.slug, city: p.city, keywords: p.keywords } as object,
      },
    });
  }

  for (const m of markets) {
    const id = `market-${m.city}-${m.propertyType}-${m.date.toISOString().slice(0, 10)}`;
    await db.copilotMemoryItem.upsert({
      where: { id },
      create: {
        id,
        userId: args.userId,
        workspaceId: args.workspaceId ?? null,
        memoryType: "market_summary",
        key: `${m.city}:${m.propertyType}`,
        city: m.city,
        propertyType: m.propertyType,
        content: compactText([
          `city:${m.city}`,
          `property_type:${m.propertyType}`,
          `avg_price_cents:${m.avgPriceCents}`,
          `avg_rent_cents:${m.avgRentCents ?? "n/a"}`,
          `date:${m.date.toISOString().slice(0, 10)}`,
        ]),
        metadata: {
          city: m.city,
          propertyType: m.propertyType,
          date: m.date.toISOString(),
        } as object,
      },
      update: {
        city: m.city,
        propertyType: m.propertyType,
        content: compactText([
          `city:${m.city}`,
          `property_type:${m.propertyType}`,
          `avg_price_cents:${m.avgPriceCents}`,
          `avg_rent_cents:${m.avgRentCents ?? "n/a"}`,
          `date:${m.date.toISOString().slice(0, 10)}`,
        ]),
        metadata: {
          city: m.city,
          propertyType: m.propertyType,
          date: m.date.toISOString(),
        } as object,
      },
    });
  }
}
