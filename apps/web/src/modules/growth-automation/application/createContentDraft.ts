import type { GrowthMarketingPlatform } from "@prisma/client";
import {
  assertNoPlaintextPassword,
  buildPublishFingerprint,
  initialDraftStatus,
  validateDraftForPlatform,
} from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";
import { pillarToContentFamily, type ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { attachTaxonomyToDraft } from "@/src/modules/growth-automation/application/taxonomyPayload";
import { createContentItem } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export async function createContentDraft(args: {
  contentType: string;
  topic: string;
  platform: GrowthMarketingPlatform;
  draftPayload: DraftPayload;
  marketingChannelId?: string | null;
  scheduledDay?: string;
  forceStatus?: "DRAFT" | "PENDING_REVIEW";
  taxonomyPillar?: ContentPillar;
  hookPattern?: string;
}) {
  const draftPayload =
    args.taxonomyPillar !== undefined
      ? attachTaxonomyToDraft(args.draftPayload, {
          taxonomyPillar: args.taxonomyPillar,
          hookPattern: args.hookPattern,
          contentFamily: pillarToContentFamily(args.taxonomyPillar),
        })
      : args.draftPayload;

  assertNoPlaintextPassword(draftPayload as unknown as Record<string, unknown>);
  const v = validateDraftForPlatform(args.platform, draftPayload);
  if (!v.ok) throw new Error(v.reason);
  const fingerprint = buildPublishFingerprint(
    args.platform,
    args.topic,
    args.scheduledDay,
    draftPayload.hook,
  );
  const status = args.forceStatus ?? initialDraftStatus();
  return createContentItem({
    contentType: args.contentType,
    topic: args.topic,
    platform: args.platform,
    status,
    draftPayload,
    marketingChannelId: args.marketingChannelId,
    publishFingerprint: fingerprint,
  });
}
