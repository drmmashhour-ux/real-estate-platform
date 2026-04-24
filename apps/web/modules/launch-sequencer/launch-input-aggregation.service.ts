import { evaluateExpansion } from "@/modules/ecosystem/expansion.engine";
import { ECOSYSTEM_LAYER_IDS } from "@/modules/ecosystem/layers";
import {
  getCountryConfig,
  listAllCountryConfigsForExpansion,
} from "@/modules/global-expansion/global-country.service";
import { getRegulationViewFromConfig } from "@/modules/global-expansion/global-regulation.service";
import { supportedLocalesForCountry } from "@/modules/global-expansion/global-localization.service";
import type { LaunchCandidateMarket } from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function staffingFromStatus(status: string): number {
  switch (status) {
    case "scaling":
      return 86;
    case "active":
      return 72;
    case "paused":
      return 38;
    case "planning":
    default:
      return 46;
  }
}

/**
 * Build scenario-based launch candidates from expansion registry + regulation views.
 * Uses conservative defaults — does not claim unsupported markets are cleared for launch.
 * Never throws.
 */
export function buildLaunchCandidateMarkets(): LaunchCandidateMarket[] {
  try {
    const configs = listAllCountryConfigsForExpansion();
    const ecosystem = evaluateExpansion({
      networkActivityIndex: 48,
      loopStrength: 52,
      adoptionDepthScore: 45,
      supportTicketsPer1kMau: 42,
      revenueStabilityIndex: 0.55,
      liveLayers: [...ECOSYSTEM_LAYER_IDS],
    });

    const out: LaunchCandidateMarket[] = [];

    for (const c of configs) {
      const reg = getRegulationViewFromConfig(c);
      const warnPenalty = Math.min(60, (reg.adminWarnings?.length ?? 0) * 14);
      const complianceReadiness = clamp100(88 - warnPenalty - (c.regulatoryFlags?.length ?? 0) * 6);

      const locales = supportedLocalesForCountry(c.countryCode);
      const localizationReadiness = clamp100(
        Math.min(100, (locales.length / 4) * 100 + (c.supportedLanguages.length > 1 ? 8 : 0)),
      );

      const productReadiness = clamp100((c.enabledFeatures?.length ?? 1) * 11 + (c.activeHubs?.length ?? 1) * 6);

      const operationalComplexity = clamp100(
        22 +
          (c.regulatoryFlags?.length ?? 0) * 12 +
          (c.expansionStatus === "planning" ? 14 : 0) +
          (c.dataHandlingMode === "STRICT_PII" ? 10 : 0),
      );

      const dataConfidence = clamp100(
        c.expansionStatus === "planning" ? 38 : c.expansionStatus === "paused" ? 42 : 70,
      );

      const opportunityScore = clamp100(
        (c.expansionReadinessScore ?? 50) * 0.65 + (ecosystem.expandBreadthRecommended ? 6 : 0),
      );

      const scenarioParts = [
        `Registry status: ${c.expansionStatus}`,
        ecosystem.expandBreadthRecommended ? "Ecosystem composite suggests breadth exploration (validate manually)." : "Ecosystem composite suggests holding breadth until fundamentals improve.",
      ];

      out.push({
        marketKey: c.countryCode,
        opportunityScore,
        operationalComplexity,
        localizationReadiness,
        complianceReadiness,
        staffingReadiness: staffingFromStatus(c.expansionStatus),
        productReadiness,
        dataConfidence,
        scenarioNote: scenarioParts.join(" · "),
      });
    }

    launchSequencerLog.info("candidate_markets_built", { count: out.length });
    return out;
  } catch {
    launchSequencerLog.warn("candidate_markets_built_failed", {});
    const ca = getCountryConfig("CA");
    if (ca) {
      return [
        {
          marketKey: ca.countryCode,
          opportunityScore: 55,
          operationalComplexity: 50,
          localizationReadiness: 55,
          complianceReadiness: 50,
          staffingReadiness: 55,
          productReadiness: 55,
          dataConfidence: 35,
          scenarioNote: "Fallback single-market profile after aggregation error — highly provisional.",
        },
      ];
    }
    return [];
  }
}
