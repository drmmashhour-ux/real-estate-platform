import { QuebecEsgResult } from "./quebec-esg.engine";
import { QuebecEsgRecommendation } from "./quebec-esg-recommendation.service";
import { greenAiLog } from "./green-ai-logger";

import type { QuebecEsgIncentiveEstimateRow } from "./quebec-esg-incentive.service";
import type { QuebecEsgRetrofitRoiResult } from "./quebec-esg-roi.service";

export interface BrokerGreenCallouts {
  highlights: string[];
  improvementPitch: string[];
  comparisonInsights: string[];
  incentiveHighlights: string[];
  budgetPitch: string[];
  roiPitch: string[];
  resalePositioning: string[];
}

export function generateBrokerGreenCallouts(
  evaluation: QuebecEsgResult,
  recommendations: QuebecEsgRecommendation[],
  extras?: {
    incentiveRows?: QuebecEsgIncentiveEstimateRow[];
    costTotalLow?: number | null;
    costTotalHigh?: number | null;
    roi?: QuebecEsgRetrofitRoiResult | null;
  },
): BrokerGreenCallouts {
  const highlights: string[] = [];
  const improvementPitch: string[] = [];
  const comparisonInsights: string[] = [];
  const incentiveHighlights: string[] = [];
  const budgetPitch: string[] = [];
  const roiPitch: string[] = [];
  const resalePositioning: string[] = [];

  // 1. Highlights
  if (evaluation.score >= 72) {
    highlights.push("Performance énergétique supérieure à la moyenne (Label GREEN)");
  }
  if (evaluation.breakdown.heating >= 90) {
    highlights.push("Système de chauffage hautement efficace");
  }
  if (evaluation.breakdown.insulation >= 80) {
    highlights.push("Excellente isolation thermique (toit et murs)");
  }
  if (evaluation.breakdown.windows >= 90) {
    highlights.push("Fenestration haute performance (triple vitrage)");
  }

  // 2. Improvement Pitch
  const topRecs = recommendations.slice(0, 2);
  for (const rec of topRecs) {
    improvementPitch.push(`${rec.title} pourrait augmenter le score de ~${rec.estimatedScoreLift} points`);
  }
  if (evaluation.breakdown.bonus < 50) {
    improvementPitch.push("L'ajout de panneaux solaires ou d'un toit vert améliorerait significativement la durabilité");
  }

  // 3. Comparison Insights
  if (evaluation.score > 60) {
    comparisonInsights.push("Surpasse les propriétés typiques de la même année de construction");
  } else {
    comparisonInsights.push("Potentiel d'optimisation élevé par rapport au standard du quartier");
  }

  if (evaluation.breakdown.insulation > evaluation.breakdown.windows) {
    comparisonInsights.push("Isolation robuste mais l'efficacité des fenêtres pourrait être optimisée");
  } else if (evaluation.breakdown.windows > evaluation.breakdown.insulation) {
    comparisonInsights.push("Fenêtres performantes mais l'isolation de l'enveloppe présente des lacunes");
  }

  incentiveHighlights.push(
    "Certain improvements may qualify for Québec or federal support, subject to eligibility and official program rules.",
  );
  if (extras?.incentiveRows?.length) {
    const active = extras.incentiveRows.filter((r) => r.status !== "closed");
    if (active.length) {
      incentiveHighlights.push(
        `Illustrative programs to verify: ${active
          .slice(0, 3)
          .map((r) => r.title)
          .join("; ")}.`,
      );
    }
  }

  if (extras?.costTotalLow != null && extras?.costTotalHigh != null) {
    budgetPitch.push(
      `Internal rough retrofit band (not a quote): about ${Math.round(extras.costTotalLow).toLocaleString("en-CA")}–${Math.round(extras.costTotalHigh).toLocaleString("en-CA")} CAD before confirmed incentives.`,
    );
  }
  budgetPitch.push(
    "Replacing inefficient windows or upgrading heating may improve comfort and performance while potentially aligning with published assistance — confirm with an energy advisor.",
  );

  if (extras?.roi?.simpleRoiNarrative?.length) {
    roiPitch.push(...extras.roi.simpleRoiNarrative.slice(0, 3));
  } else {
    roiPitch.push("ROI depends on actual installed costs, incentives, and energy prices — treat any app estimate as non-binding.");
  }

  if (evaluation.score < 65 && recommendations.length >= 2) {
    resalePositioning.push("This property has meaningful upgrade potential that may support stronger buyer positioning when documented professionally.");
  } else if (evaluation.score >= 72) {
    resalePositioning.push("Strong efficiency positioning can highlight marketability versus average stock — avoid implying a guaranteed price premium.");
  } else {
    resalePositioning.push("Frame efficiency upgrades as comfort and operating-cost stories; let pricing follow local comps and professional advice.");
  }
  const neutralResale = extras?.roi?.resaleImpactScenario?.neutral;
  if (neutralResale?.length) {
    resalePositioning.push(...neutralResale.slice(0, 2));
  }

  greenAiLog.info("quebec_esg_callouts_generated", {
    highlightCount: highlights.length,
    pitchCount: improvementPitch.length,
  });

  return {
    highlights,
    improvementPitch,
    comparisonInsights,
    incentiveHighlights,
    budgetPitch,
    roiPitch,
    resalePositioning,
  };
}
