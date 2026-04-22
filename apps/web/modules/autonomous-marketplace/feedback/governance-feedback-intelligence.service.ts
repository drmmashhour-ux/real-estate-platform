/**
 * Deterministic clusters & drift alerts from persisted feedback-shaped rows.
 */
import type { PersistGovernanceFeedbackRecordParams } from "./governance-feedback.repository";
import type {
  GovernanceIntelligenceAnalysis,
  GovernanceIntelligenceCluster,
  GovernanceIntelligenceDriftAlert,
} from "./governance-feedback-intelligence.types";
import type { GovernanceFeedbackInput, GovernanceFeedbackResult } from "./governance-feedback.types";

function bucketKey(input: GovernanceFeedbackInput): string {
  const action = input.actionType?.trim() || "UNKNOWN_ACTION";
  const region = input.regionCode?.trim() || "GLOBAL";
  return `${action}|${region}`;
}

function bucketLabel(dim: string): string {
  const [action, region] = dim.split("|");
  return `${action} · ${region}`;
}

/** Parse event times; fallback preserves caller order via synthetic offset. */
function recordSortTime(row: PersistGovernanceFeedbackRecordParams, index: number): number {
  const events = row.input.truthEvents ?? [];
  let max = 0;
  for (const e of events) {
    const t = Date.parse(e.occurredAt);
    if (Number.isFinite(t)) max = Math.max(max, t);
  }
  if (max > 0) return max;
  return index + 1;
}

function isHarmOutcome(result: GovernanceFeedbackResult): boolean {
  return (
    result.falseNegative ||
    result.label === "MISSED_RISK" ||
    result.label === "BAD_APPROVAL" ||
    result.label === "BAD_EXECUTION" ||
    result.label === "BAD_BLOCK"
  );
}

/** Hotspots: repeated outcome label + leaked revenue in the same governance bucket. */
export function buildGovernanceClusters(
  rows: readonly PersistGovernanceFeedbackRecordParams[],
): GovernanceIntelligenceCluster[] {
  type Agg = { count: number; leaked: number; label: GovernanceFeedbackResult["label"] };
  const map = new Map<string, Agg>();

  for (const row of rows) {
    const dim = bucketKey(row.input);
    const { label } = row.result;
    const leaked = Math.max(0, row.result.leakedRevenueEstimate ?? 0);

    const focusLabels: GovernanceFeedbackResult["label"][] = ["MISSED_RISK", "BAD_EXECUTION", "BAD_APPROVAL"];
    if (!focusLabels.includes(label)) continue;

    const key = `${dim}::${label}`;
    const cur = map.get(key) ?? { count: 0, leaked: 0, label };
    cur.count += 1;
    cur.leaked += leaked;
    map.set(key, cur);
  }

  const out: GovernanceIntelligenceCluster[] = [];

  for (const [compound, agg] of map) {
    const dim = compound.split("::")[0] ?? compound;
    const labelFocus = agg.label;

    let severity: GovernanceIntelligenceCluster["severity"] = "INFO";
    if (labelFocus === "MISSED_RISK") {
      if (agg.count >= 3 && agg.leaked >= 150) severity = "CRITICAL";
      else if (agg.count >= 2 && agg.leaked >= 40) severity = "WARNING";
      else if (agg.count >= 2) severity = "WARNING";
    } else if (labelFocus === "BAD_EXECUTION" || labelFocus === "BAD_APPROVAL") {
      if (agg.count >= 4 && agg.leaked >= 200) severity = "CRITICAL";
      else if (agg.count >= 2 && agg.leaked >= 75) severity = "WARNING";
    }

    if (severity === "INFO") continue;

    const title =
      severity === "CRITICAL"
        ? `Hotspot — ${labelFocus.replace(/_/g, " ")}`
        : `Elevated pattern — ${labelFocus.replace(/_/g, " ")}`;

    out.push({
      id: `cluster:${compound}`,
      severity,
      title,
      dimension: bucketLabel(dim),
      labelFocus,
      caseCount: agg.count,
      leakedRevenueSum: agg.leaked,
      rationale:
        severity === "CRITICAL"
          ? `${agg.count} cases in this slice with combined estimated leakage ${agg.leaked.toFixed(0)} — review thresholds and signal coverage.`
          : `${agg.count} cases clustered here with estimated leakage ${agg.leaked.toFixed(0)} — monitor and sample approvals.`,
    });
  }

  out.sort((a, b) => {
    const sev = (s: GovernanceIntelligenceCluster["severity"]) => (s === "CRITICAL" ? 0 : s === "WARNING" ? 1 : 2);
    const d = sev(a.severity) - sev(b.severity);
    if (d !== 0) return d;
    return b.leakedRevenueSum - a.leakedRevenueSum;
  });

  return out;
}

/** Compare older vs newer windows on harmful outcome rate. */
export function buildGovernanceDriftAlerts(
  rows: readonly PersistGovernanceFeedbackRecordParams[],
): GovernanceIntelligenceDriftAlert[] {
  if (rows.length < 10) return [];

  const indexed = rows.map((row, i) => ({ row, i, t: recordSortTime(row, i) }));
  indexed.sort((a, b) => a.t - b.t || a.i - b.i);

  const n = indexed.length;
  const split = Math.max(2, Math.floor(n * 0.55));
  const baselineSlice = indexed.slice(0, split);
  const recentSlice = indexed.slice(split);

  if (baselineSlice.length < 4 || recentSlice.length < 4) return [];

  const rate = (slice: typeof baselineSlice) => {
    const hits = slice.filter((x) => isHarmOutcome(x.row.result)).length;
    return hits / slice.length;
  };

  const baselineRate = rate(baselineSlice);
  const recentRate = rate(recentSlice);
  const delta = recentRate - baselineRate;

  const metric = "harmful_outcome_rate";

  let severity: GovernanceIntelligenceDriftAlert["severity"] | null = null;
  if (delta >= 0.28 && recentRate >= 0.35) severity = "CRITICAL";
  else if (delta >= 0.14 && recentRate >= 0.2) severity = "WARNING";

  if (!severity) return [];

  return [
    {
      id: `drift:${metric}:${severity}`,
      severity,
      metric,
      baselineRate,
      recentRate,
      delta,
      baselineSampleSize: baselineSlice.length,
      recentSampleSize: recentSlice.length,
      rationale:
        severity === "CRITICAL"
          ? `Recent window harmful-outcome rate ${(recentRate * 100).toFixed(1)}% vs baseline ${(baselineRate * 100).toFixed(1)}% — investigate governance drift.`
          : `Harmful-outcome rate lifted in the recent window (${(recentRate * 100).toFixed(1)}% vs ${(baselineRate * 100).toFixed(1)}% baseline).`,
    },
  ];
}

export function analyzeGovernanceIntelligence(
  rows: readonly PersistGovernanceFeedbackRecordParams[],
): GovernanceIntelligenceAnalysis {
  const clusters = buildGovernanceClusters(rows);
  const driftAlerts = buildGovernanceDriftAlerts(rows);
  return { clusters, driftAlerts };
}

function stubResult(partial: Partial<GovernanceFeedbackResult>): GovernanceFeedbackResult {
  return {
    label: "GOOD_EXECUTION",
    confidence: "MEDIUM",
    falsePositive: false,
    falseNegative: false,
    protectedRevenueEstimate: 0,
    leakedRevenueEstimate: 0,
    reasons: [],
    recommendedActions: [],
    ...partial,
  };
}

function minimalPrediction(): GovernanceFeedbackInput["prediction"] {
  return {
    governanceDisposition: "AUTO_EXECUTE",
    blocked: false,
    requiresHumanApproval: false,
    allowExecution: true,
    legalRiskScore: 10,
    legalRiskLevel: "LOW",
    fraudRiskScore: 10,
    fraudRiskLevel: "LOW",
    combinedRiskScore: 10,
    combinedRiskLevel: "LOW",
  };
}

/**
 * Deterministic demo dataset for empty stores — advisory UI only (optional `?demo=1` on API).
 * Produces a CRITICAL MISSED_RISK cluster and a CRITICAL drift alert when analyzed.
 */
export function buildDemoGovernanceFeedbackRecordsForIntelligence(): PersistGovernanceFeedbackRecordParams[] {
  const actionHotspot = "CREATE_BOOKING";
  const region = "ca_qc";
  const rows: PersistGovernanceFeedbackRecordParams[] = [];

  for (let i = 0; i < 9; i++) {
    rows.push({
      input: {
        actionType: "CREATE_TASK",
        regionCode: region,
        prediction: minimalPrediction(),
        truthEvents: [{ type: "execution_succeeded", occurredAt: `2026-01-${String(10 + i).padStart(2, "0")}T15:00:00.000Z` }],
      },
      result: stubResult({ label: "GOOD_EXECUTION" }),
    });
  }

  for (let i = 0; i < 4; i++) {
    rows.push({
      input: {
        actionType: actionHotspot,
        regionCode: region,
        prediction: minimalPrediction(),
        truthEvents: [
          { type: "chargeback", occurredAt: `2026-03-${String(5 + i).padStart(2, "0")}T12:00:00.000Z`, amount: 250 },
        ],
      },
      result: stubResult({
        label: "MISSED_RISK",
        falseNegative: true,
        leakedRevenueEstimate: 280,
      }),
    });
  }

  for (let i = 0; i < 8; i++) {
    rows.push({
      input: {
        actionType: "PUBLISH_LISTING",
        regionCode: region,
        prediction: minimalPrediction(),
        truthEvents: [
          { type: "chargeback", occurredAt: `2026-04-${String(1 + i).padStart(2, "0")}T18:00:00.000Z`, amount: 400 },
        ],
      },
      result: stubResult({
        label: "MISSED_RISK",
        falseNegative: true,
        leakedRevenueEstimate: 400,
      }),
    });
  }

  return rows;
}
