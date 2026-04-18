/**
 * Experiment labels for campaigns — bookkeeping only until experiments DB wired.
 */
export type CampaignExperimentLabel = {
  hypothesis: string;
  variantA: string;
  variantB: string;
};

export function suggestCampaignExperiment(city: string): CampaignExperimentLabel {
  return {
    hypothesis: `Buyers in ${city} respond better to clarity vs urgency in headline tests.`,
    variantA: "Clarity-first headline (specific neighborhood)",
    variantB: "Urgency-first headline (limited inventory language)",
  };
}
