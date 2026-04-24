/**
 * Long-horizon scenarios — narrative / educational only. No return projections.
 */

import { ALLOCATION_BUCKET_KEYS, type WealthProfile, type WealthScenario } from "./wealth.types";
import { DEFAULT_BUCKET_LABELS } from "./allocation.service";

function line(key: AllocationBucketKey, text: string) {
  return { bucketKey: key, illustrativeShiftDescription: text };
}

/**
 * Produce three parallel educational scenarios. No Monte Carlo, no CAGR promises.
 */
export function simulateWealthScenarios(profile: WealthProfile): WealthScenario[] {
  void profile;
  const conservative: WealthScenario = {
    mode: "CONSERVATIVE",
    assumptions: [
      "Illustrative thought experiment: prioritize liquidity, shorter decision cycles, and smaller idiosyncratic bets.",
      "Time horizon discussed as multi-decade preservation with emphasis on survivability of lifestyle spend.",
      "Assumes frequent review of concentration — not buy/hold forever as a default story.",
    ],
    allocationImpacts: [
      line(
        "CASH_RESERVE",
        "Discussion emphasizes reserve posture and runway; numbers in your profile drive comparisons, not this narrative."
      ),
      line(
        "PUBLIC_MARKETS",
        "Educational framing may lean on liquid, diversified public exposure as a planning anchor — not a security pick."
      ),
      line("REAL_ESTATE", "Real assets treated as ballast in conversation; illiquidity and carry costs noted qualitatively."),
      line(
        "PRIVATE_INVESTMENTS",
        "Private sleeves discussed with smaller illustrative weight and longer lock-up awareness."
      ),
      line("OPERATING_VENTURES", "Operating exposure reviewed for cash-flow dependency vs diversification goals."),
      line(
        "OPPORTUNISTIC_CAPITAL",
        "Opportunistic bucket sized last; emphasizes discipline over chasing headline deals."
      ),
    ],
    resilienceNotes: [
      "Resilience framed as ability to adapt spending and redeploy without fire-sales — qualitative only.",
      "Does not estimate probability of success or failure.",
    ],
  };

  const balanced: WealthScenario = {
    mode: "BALANCED",
    assumptions: [
      "Illustrative path between operating growth, real assets, and liquid diversifiers.",
      "Discusses rebalancing as a discipline, not a forecast of which asset wins.",
      "Compatible with multi-decade horizon when paired with governance and tax planning (outside this tool).",
    ],
    allocationImpacts: ALLOCATION_BUCKET_KEYS.map((key) =>
      line(
        key,
        `Baseline balance: ${DEFAULT_BUCKET_LABELS[key]} tracked near your configurable targets for discussion.`
      )
    ),
    resilienceNotes: [
      "Resilience notes stress diversification across sleeves you already track in the profile.",
      "Encourages documenting decision rules rather than reacting to headlines.",
    ],
  };

  const aggressive: WealthScenario = {
    mode: "AGGRESSIVE",
    assumptions: [
      "Illustrative thought experiment: accepts more idiosyncratic risk in exchange for potential growth — without quantifying returns.",
      "Assumes willingness to tolerate drawdowns in some sleeves if liquidity and reserves are consciously set elsewhere.",
      "Requires explicit conversation about venture, private, and real-estate illiquidity.",
    ],
    allocationImpacts: [
      line(
        "OPERATING_VENTURES",
        "Scenario explores reinvestment and growth bias in operating capital — liquidity trade-offs highlighted in text only."
      ),
      line(
        "OPPORTUNISTIC_CAPITAL",
        "Discusses keeping capacity for asymmetric opportunities; not a directive to concentrate."
      ),
      line(
        "CASH_RESERVE",
        "Reserve target may be discussed lower versus conservative framing; runway trade-offs spelled out narratively only."
      ),
      line("PRIVATE_INVESTMENTS", "Private sleeves may take larger discussion weight with illiquidity caveats."),
      line("REAL_ESTATE", "Real assets may include development or value-add themes in planning dialogue — still scenario-only."),
      line(
        "PUBLIC_MARKETS",
        "Public sleeve may be used for liquidity and rebalancing rather than maximal idiosyncratic bets."
      ),
    ],
    resilienceNotes: [
      "Resilience depends on runway and non-correlated liquidity — called out narratively, not modeled.",
      "Suitable only for users who understand permanent loss risk; tool remains non-advisory.",
    ],
  };

  return [conservative, balanced, aggressive];
}
