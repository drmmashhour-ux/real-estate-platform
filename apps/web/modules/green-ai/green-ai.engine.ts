import type { GreenEngineInput } from "@/modules/green/green.types";
import type { GreenAiEngineOutput, GreenAiPerformanceLabel, GreenVerificationLevel } from "./green.types";
import { evaluateQuebecEsg, QUEBEC_ESG_CRITERIA_DISCLAIMER, type QuebecEsgLabel } from "./quebec-esg.engine";
import { resolveVerificationLevel, type DocumentRefInput } from "./green-verification.service";
import { greenAiLog } from "./green-ai-logger";

function mapQuebecLabelToAi(label: QuebecEsgLabel): GreenAiPerformanceLabel {
  if (label === "STANDARD") return "IMPROVABLE";
  return label;
}

function heuristicIssues(input: GreenEngineInput, score: number): string[] {
  const issues: string[] = [];
  const heat = (input.heatingType ?? "").toLowerCase();
  if (heat.includes("oil") || heat.includes("electric baseboard")) {
    issues.push("Heating archetype suggests higher operating emissions until upgraded.");
  }
  const insulPoor =
    input.insulationQuality === "poor" ||
    input.insulationQuality === "unknown" ||
    input.atticInsulationQuality === "poor" ||
    input.wallInsulationQuality === "poor";
  if (insulPoor) {
    issues.push("Envelope performance may be a limiting factor — verify attic & wall insulation levels.");
  }
  if (input.windowsQuality === "single" || input.windowsQuality === "unknown") {
    issues.push("Glazing performance may increase heating/cooling loads.");
  }
  if (score < 48) {
    issues.push("Overall modeled performance band is weak — prioritize envelope + HVAC upgrades.");
  }
  return issues.slice(0, 6);
}

function heuristicRecommendations(score: number): string[] {
  if (score >= 72) return ["Maintain documentation for upgrades", "Consider PV right-sizing study where applicable"];
  if (score >= 48)
    return ["Prioritize insulation + air sealing", "Evaluate cold-climate heat pump sizing", "Plan window upgrade phasing"];
  return ["Start with energy audit-level discovery", "Target attic/air sealing quick wins", "Collect invoices for major retrofits"];
}

function confidenceFromSignals(level: GreenVerificationLevel, score: number): number {
  let c = level === "DOCUMENT_SUPPORTED" ? 78 : level === "PROFESSIONAL_VERIFIED" ? 92 : 46;
  if (score >= 72) c += 6;
  if (score < 40) c -= 10;
  return Math.min(100, Math.max(15, Math.round(c)));
}

export type RunGreenAiAnalysisArgs = {
  intake: GreenEngineInput;
  documents?: DocumentRefInput[];
  persistedVerificationLevel?: string | null;
};

/**
 * Full AI green assessment — combines deterministic physics-style heuristic engine + verification tier.
 */
export function runGreenAiAnalysis(args: RunGreenAiAnalysisArgs): GreenAiEngineOutput {
  const qc = evaluateQuebecEsg(args.intake);
  const verificationLevel = resolveVerificationLevel({
    documents: args.documents ?? [],
    persistedLevel: args.persistedVerificationLevel ?? null,
  });

  const score = qc.score;
  const label = mapQuebecLabelToAi(qc.label);
  const confidence = confidenceFromSignals(verificationLevel, score);
  const priorityFlags = qc.improvementAreas.map((a) => `Improvement focus: ${a}`);
  const issues = [...priorityFlags, ...heuristicIssues(args.intake, score)].slice(0, 8);
  const recommendations = heuristicRecommendations(score);

  const quebecEsg = {
    score: qc.score,
    label: qc.label,
    breakdown: qc.breakdown,
    improvementAreas: qc.improvementAreas,
    quebecDisclaimer: QUEBEC_ESG_CRITERIA_DISCLAIMER,
  };

  greenAiLog.info("green_ai_analysis_complete", {
    score,
    label,
    verificationLevel,
    confidence,
    quebecLabel: qc.label,
  });

  return {
    score,
    label,
    verificationLevel,
    confidence,
    issues,
    recommendations,
    quebecEsg,
  };
}
