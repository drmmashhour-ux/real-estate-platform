import { NextResponse } from "next/server";
import { LeadMarketplaceStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/lead-marketplace/listings — browse available scored leads (contact masked until purchase).
 */
export async function GET() {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const rows = await prisma.leadMarketplaceListing.findMany({
    where: { status: LeadMarketplaceStatus.available },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: 80,
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          fsboListingId: true,
          lecipmLeadScore: true,
          lecipmDealQualityScore: true,
          lecipmTrustScore: true,
          lecipmUrgencyScore: true,
          highIntent: true,
          engagementScore: true,
          purchaseRegion: true,
        },
      },
    },
  });

  return NextResponse.json({
    listings: rows.map((r) => ({
      id: r.id,
      leadId: r.leadId,
      score: r.score,
      priceCents: r.priceCents,
      fsboListingId: r.fsboListingId,
      preview: {
        nameHint: maskName(r.lead.name),
        region: r.lead.purchaseRegion ?? null,
        lecipmLeadScore: r.lead.lecipmLeadScore,
        lecipmDealQualityScore: r.lead.lecipmDealQualityScore,
        lecipmTrustScore: r.lead.lecipmTrustScore,
        lecipmUrgencyScore: r.lead.lecipmUrgencyScore,
        highIntent: r.lead.highIntent,
        engagementScore: r.lead.engagementScore,
      },
    })),
  });
}

function maskName(name: string): string {
  const t = name.trim();
  if (t.length <= 2) return "•••";
  return `${t[0]}${"•".repeat(Math.min(6, t.length - 2))}${t[t.length - 1]!}`;
}
