/**
 * Wraps existing attribution helpers — no synthetic channel volumes.
 */

import { mergeTrafficAttributionIntoMetadata } from "@/lib/attribution/social-traffic";
import { prisma } from "@/lib/db";
import {
  prismaWhereMontrealFsbo,
  prismaWhereMontrealShortTerm,
} from "@/modules/market-intelligence/neighborhood-clustering.service";
import { subDays } from "date-fns";

export { mergeTrafficAttributionIntoMetadata };

export type AttributionSummary = {
  since: string;
  leadSourceBreakdown: { source: string | null; count: number }[];
  campaignTop: { campaign: string | null; count: number }[];
};

export async function summarizeMontrealLeadAttribution(windowDays = 90): Promise<AttributionSummary> {
  const since = subDays(new Date(), windowDays);
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { shortTermListingId: { not: null }, bnhubStayForLead: prismaWhereMontrealShortTerm() },
        { fsboListing: { is: prismaWhereMontrealFsbo() } },
      ],
    },
    select: { source: true, campaign: true },
  });

  const bySource = new Map<string | null, number>();
  const byCampaign = new Map<string | null, number>();
  for (const l of leads) {
    bySource.set(l.source ?? null, (bySource.get(l.source ?? null) ?? 0) + 1);
    byCampaign.set(l.campaign ?? null, (byCampaign.get(l.campaign ?? null) ?? 0) + 1);
  }

  const leadSourceBreakdown = [...bySource.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const campaignTop = [...byCampaign.entries()]
    .map(([campaign, count]) => ({ campaign, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return { since: since.toISOString(), leadSourceBreakdown, campaignTop };
}
