import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { investIntelLog } from "./investor-intel-logger";
import type { ExpansionScenarioInput, ExpansionScenarioOutput } from "./investor-intelligence.types";

const DISCLAIMER =
  "Scenario only; not financial advice, not a forecast of return. Assumptions are editable and may not hold.";

/**
 * Heuristic what-if. No compounding, no “IRR guarantee”.
 */
export async function simulateInvestmentScenario(
  input: ExpansionScenarioInput,
  userId?: string | null
): Promise<ExpansionScenarioOutput> {
  const scenarioKey = `sim-${input.marketKey}-${input.action}-${Date.now()}`.slice(0, 120);
  const a = { ...input.assumptions, action: input.action, market: input.marketKey, segment: input.segmentKey ?? "" };
  const proj: { label: string; value: string; basedOn: string }[] = [];
  if (input.action === "increase_broker_capacity") {
    const pct = Number(input.assumptions.capacityDeltaPct ?? 10);
    proj.push({
      label: "Implied deal throughput (qualitative band)",
      value: `+${Math.min(25, Math.max(0, pct * 0.4)).toFixed(0)}% possible`,
      basedOn: "Assumes new capacity is utilized like recent cohort (not guaranteed).",
    });
  } else if (input.action === "shift_lead_routing") {
    proj.push({
      label: "Expected segment attention shift",
      value: "Rerank only; human confirmation",
      basedOn: "Tie to brokerage-intelligence routing layer (suggestion, not auto-assign).",
    });
  } else {
    proj.push({ label: "Narrative stress-test", value: "Low precision by design", basedOn: "Sparse or generic scenario." });
  }
  const risks = [
    { type: "model", message: "Inputs are partial; out-of-model macro risks apply." },
    { type: "ethics", message: "Do not use metrics to assert personal traits; aggregate only." },
  ];
  const out: ExpansionScenarioOutput = {
    scenarioKey,
    marketKey: input.marketKey,
    segmentKey: input.segmentKey ?? null,
    assumptions: a,
    projectedImpact: proj,
    risks,
    confidence: "low",
    rationale: [
      "We use linear, bounded heuristics — not a simulation of stock-market style returns for real estate brokerage ops.",
    ],
    disclaimer: DISCLAIMER,
  };
  try {
    await prisma.expansionScenario.create({
      data: {
        scenarioKey,
        marketKey: input.marketKey,
        segmentKey: input.segmentKey ?? null,
        assumptionsJson: a,
        projectedImpactJson: { items: proj },
        riskJson: { items: risks },
        createdByUserId: userId ?? undefined,
        status: "DRAFT",
      },
    });
  } catch (e) {
    investIntelLog.warn("scenario_persist", { err: e instanceof Error ? e.message : String(e) });
  }
  investIntelLog.scenario({ k: scenarioKey });
  return out;
}
