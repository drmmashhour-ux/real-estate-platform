import { generateAdCopy, type GenerateAdCopyInput } from "./ads-creative-ai.service";
import { getInitialBudgetPlan } from "./live-campaigns.service";

export type AiCampaignStructure = {
  campaignName: string;
  objective: string;
  audienceTargeting: string[];
  budgetSuggestion: ReturnType<typeof getInitialBudgetPlan>;
  creatives: ReturnType<typeof generateAdCopy>;
  channel: GenerateAdCopyInput["platform"];
  notes: string[];
};

const DEFAULT_INPUT: GenerateAdCopyInput = {
  platform: "meta",
  objective: "lead",
  city: "Montréal",
  audience: "Travel + relocation intent, 21–55, Montréal metro",
};

/**
 * Bundles naming, targeting hints, budget copy, and creatives — human pastes into Ads Manager.
 */
export function generateCampaignStructure(
  input: Partial<GenerateAdCopyInput> = {},
): AiCampaignStructure {
  const merged: GenerateAdCopyInput = { ...DEFAULT_INPUT, ...input };
  const creatives = generateAdCopy(merged);
  const budgetSuggestion = getInitialBudgetPlan();

  const campaignName = `LECIPM · ${merged.city} · ${merged.objective.replace("_", " ")} · ${merged.platform}`;

  const audienceTargeting = [
    `Geo: ${merged.city} + reasonable radius (set in Ads UI)`,
    `Interests / keywords: align to “${merged.audience}”`,
    "Exclude: existing customers list upload when CRM export available",
  ];

  return {
    campaignName,
    objective:
      merged.objective === "booking"
        ? "Traffic / conversions toward BNHub checkout starts"
        : merged.objective === "lead"
          ? "Lead generation — CRM capture on LECIPM"
          : "Host acquisition — BNHub listing creation",
    audienceTargeting,
    budgetSuggestion,
    creatives,
    channel: merged.platform,
    notes: [
      "No Meta/Google API calls from LECIPM — export copy manually.",
      "UTM: align with `utm_campaign` in Marketing System for funnel joins.",
    ],
  };
}
