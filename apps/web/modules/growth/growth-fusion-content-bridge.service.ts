/**
 * Advisory content-gap surfacing — recommendations only; no auto-generation here.
 */

import { growthFusionFlags } from "@/config/feature-flags";
import type { GrowthFusionSummary } from "./growth-fusion.types";

export type GrowthFusionContentBridgeRecommendation = {
  kind: "ad_copy" | "listing_copy" | "outreach_copy";
  title: string;
  rationale: string;
};

export type GrowthFusionContentBridgeResult = {
  contentGapDetected: boolean;
  recommendations: GrowthFusionContentBridgeRecommendation[];
  note: string;
};

/**
 * When fusion sees empty drafts (and content assist could apply), list safe next steps.
 * No draft generation in this layer — use Content Studio when flags allow.
 */
export function buildGrowthFusionContentBridge(summary: GrowthFusionSummary): GrowthFusionContentBridgeResult | null {
  if (!growthFusionFlags.growthFusionContentBridgeV1) {
    return null;
  }

  const contentSignals = summary.grouped.content;
  const hasGapSignal = contentSignals.some((s) => s.type === "coverage" || s.id.includes("content-gap"));
  if (!hasGapSignal) {
    return {
      contentGapDetected: false,
      recommendations: [],
      note: "No content gap flagged by fusion in this run.",
    };
  }

  return {
    contentGapDetected: true,
    recommendations: [
      {
        kind: "ad_copy",
        title: "Draft ad copy variants for top campaigns",
        rationale: "Align paid messaging with fused priorities before scaling impressions.",
      },
      {
        kind: "listing_copy",
        title: "Refresh listing copy for conversion-led pages",
        rationale: "Strong CRO work pairs with clearer on-page value props.",
      },
      {
        kind: "outreach_copy",
        title: "Prepare outreach snippets for high-intent leads",
        rationale: "Follow-up execution benefits from pre-approved templates (manual send).",
      },
    ],
    note: "Open Content Studio to generate drafts — fusion does not auto-create content.",
  };
}
