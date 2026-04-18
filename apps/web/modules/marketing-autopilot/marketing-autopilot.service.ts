import { prisma } from "@/lib/db";
import { residentialBrokerFsboWhere } from "@/lib/broker/residential-fsbo-scope";
import { createMarketingDraft } from "../marketing-drafts/marketing-draft.service";
import { allowLowRiskAutoQueue } from "./marketing-policy.service";
import { buildPlansForListing } from "./marketing-autopilot.engine";
import type { MarketingAutopilotOutputType } from "./marketing-autopilot.types";
import { markAutopilotRun } from "./marketing-memory.service";

export async function generateMarketingDraftsForListing(input: {
  brokerId: string;
  listingId: string;
  kinds: MarketingAutopilotOutputType[];
  previousPriceCents?: number | null;
}): Promise<{ draftIds: string[] }> {
  const listing = await prisma.fsboListing.findFirst({
    where: { id: input.listingId, ...residentialBrokerFsboWhere(input.brokerId) },
  });
  if (!listing) return { draftIds: [] };

  const plans = buildPlansForListing({
    listing,
    kinds: input.kinds,
    previousPriceCents: input.previousPriceCents,
  });

  const draftIds: string[] = [];
  const status = allowLowRiskAutoQueue() ? "ready_for_review" : "draft";

  for (const p of plans) {
    const row = await createMarketingDraft({
      listingId: input.listingId,
      brokerId: input.brokerId,
      payload: {
        draftType: p.draftType,
        channel: p.channel,
        title: p.title,
        subject: p.subject,
        body: p.body,
        metadata: p.metadata,
      },
      status,
    });
    draftIds.push(row.id);
  }

  markAutopilotRun(input.listingId);
  return { draftIds };
}
