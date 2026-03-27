/**
 * Lightweight decision score (rule-based, not ML). For investor vs buyer UX only.
 */

export type CompareMode = "investor" | "buyer";

export type ScoreInputs = {
  id: string;
  roiPercent: number;
  annualCashFlow: number;
  price: number;
  capRatePercent: number;
  featureScore: number;
};

function normMinMax(values: number[], higherIsBetter: boolean): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => {
    const t = (v - min) / (max - min);
    return higherIsBetter ? t : 1 - t;
  });
}

export function computeDecisionScores(
  mode: CompareMode,
  rows: ScoreInputs[]
): { bestId: string | null; scores: Record<string, number> } {
  if (rows.length === 0) return { bestId: null, scores: {} };

  const ids = rows.map((r) => r.id);
  const roiN = normMinMax(
    rows.map((r) => r.roiPercent),
    true
  );
  const cfN = normMinMax(
    rows.map((r) => r.annualCashFlow),
    true
  );
  const capN = normMinMax(
    rows.map((r) => r.capRatePercent),
    true
  );
  const priceN = normMinMax(
    rows.map((r) => r.price),
    false
  );
  const featN = normMinMax(
    rows.map((r) => r.featureScore),
    true
  );

  const scores: Record<string, number> = {};
  rows.forEach((r, i) => {
    const s =
      mode === "investor"
        ? roiN[i] * 0.45 + cfN[i] * 0.35 + capN[i] * 0.2
        : priceN[i] * 0.4 + featN[i] * 0.3 + roiN[i] * 0.15 + cfN[i] * 0.15;
    scores[r.id] = Math.round(s * 1000) / 1000;
  });

  const bestId = ids.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  return { bestId, scores };
}
