import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import { minimalV3Payload } from "@/modules/control-center-v4/test-fixtures/v3-minimal";

export function minimalV4Payload(): CompanyCommandCenterV4Payload {
  const v3 = minimalV3Payload();
  return {
    v3,
    presets: [],
    activePreset: null,
    briefing: { cards: [{ id: "c1", title: "Sample", severity: "info", summary: "x", systemsInvolved: [], keyMetrics: {}, recommendedFocus: null }] },
    anomalyDigest: {
      items: [],
      countsBySeverity: { info: 0, watch: 0, warning: 0, critical: 0 },
    },
    changesSinceYesterday: {
      systems: [],
      executiveSummary: ["Line 1"],
      insufficientBaseline: false,
    },
    meta: {
      currentWindow: { days: 7, offsetDays: 0, label: "cur" },
      previousWindow: { days: 7, offsetDays: 1, label: "prev" },
      dataFreshnessMs: 1,
      sourcesUsed: ["t"],
      missingSources: [],
      cardsGenerated: 1,
      digestItemCount: 0,
      deltaSummaryCount: 0,
      presetId: null,
      role: "founder",
    },
  };
}
