/**
 * Adapts growth content drafts to channel-specific shapes (copy only — no sends).
 */
import type { GrowthContentInput } from "./growth-content.service";
import { generateGrowthContentDrafts } from "./growth-content.service";

export function adaptGrowthCopyForChannels(input: GrowthContentInput) {
  const base = generateGrowthContentDrafts(input);
  return {
    google: base.googleAdsStyle,
    meta: {
      primaryText: base.socialCaptions[0] ?? base.poster.subhead,
      headline: base.poster.headline,
      description: base.googleAdsStyle.descriptions[0],
    },
    linkedin: {
      post: `${base.poster.headline}\n\n${base.poster.subhead}\n\n${base.poster.cta}`,
    },
    emailOutreach: {
      subject: base.poster.headline,
      body: `${base.poster.subhead}\n\n${base.googleAdsStyle.descriptions.slice(0, 2).join("\n\n")}`,
    },
  };
}
