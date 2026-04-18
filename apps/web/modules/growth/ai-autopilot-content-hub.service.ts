/**
 * Bundles ad / listing / outreach drafts for Growth UI — read-only assembly.
 */

import { aiAutopilotContentAssistFlags } from "@/config/feature-flags";
import type { AiContentDraft, GrowthContentHubSnapshot } from "./ai-autopilot-content.types";
import {
  generateAdCopyDrafts,
  generateListingCopyDrafts,
  generateOutreachDrafts,
} from "./ai-autopilot-content-assist.service";

export type ContentHubResult = {
  adCopy: AiContentDraft[];
  listingCopy: AiContentDraft[];
  outreachCopy: AiContentDraft[];
};

/** Split drafts by type for dashboard sections. */
export function buildContentHub(
  snapshot: GrowthContentHubSnapshot,
  opts?: { refreshKey?: number; now?: string },
): ContentHubResult {
  if (!aiAutopilotContentAssistFlags.contentAssistV1) {
    return { adCopy: [], listingCopy: [], outreachCopy: [] };
  }

  const rk = opts?.refreshKey ?? 0;
  const now = opts?.now;

  const adCopy = generateAdCopyDrafts(
    {
      campaignName: snapshot.campaign?.name,
      utmCampaign: snapshot.campaign?.utmCampaign,
      leadSegment: snapshot.leadSegment,
    },
    { now, refreshKey: rk },
  );

  const listingCopy = snapshot.listing
    ? generateListingCopyDrafts(snapshot.listing, { now, refreshKey: rk })
    : generateListingCopyDrafts(
        {
          title: "Sample listing",
          description: "Replace with your property details in Marketing Studio.",
          city: "Your city",
          propertyType: "property",
          highlights: [],
        },
        { now, refreshKey: rk },
      );

  const outreachCopy = generateOutreachDrafts(
    { city: snapshot.listing?.city, leadSegment: snapshot.leadSegment },
    { now, refreshKey: rk },
  );

  return { adCopy, listingCopy, outreachCopy };
}
