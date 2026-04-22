/**
 * Auto Policy Proposal Engine v1 — inspects evidence, emits deterministic proposals. Never throws.
 * Deduplication and final sort live in `policy-proposal-report.service.ts`.
 */
import type { GovernancePerformanceSummary } from "../feedback/governance-feedback.types";
import type {
  GovernanceIntelligenceAnalysis,
  GovernanceIntelligenceCluster,
  GovernanceIntelligenceDriftAlert,
} from "../feedback/governance-feedback-intelligence.types";
import type { PolicySimulationComparisonReport } from "../simulation/policy-simulation.types";
import {
  buildImpactEstimateFromSimulationScenarioDelta,
  rankPolicyProposalConfidence,
  rankPolicyProposalPriority,
  unacceptableSimulationFpIncrease,
} from "./policy-proposal-helpers.service";
import type { PolicyProposal, PolicyProposalEvidence, PolicyProposalInput } from "./policy-proposal.types";

const LEAK_HIGH = 800;
const FN_HIGH = 0.1;
const REPEATED_FN_CLUSTER_MIN = 2;

type NextProposalId = (kind: string) => string;

export function evidence(
  sourceType: PolicyProposalEvidence["sourceType"],
  sourceKey: string,
  partial?: Pick<PolicyProposalEvidence, "metric" | "value" | "note">,
): PolicyProposalEvidence {
  return { sourceType, sourceKey, ...partial };
}

function proposalsFromPerformanceSummary(nextId: NextProposalId, perf: PolicyProposalInput["performanceSummary"]): PolicyProposal[] {
  if (!perf || perf.totalCases < 3) return [];

  const out: PolicyProposal[] = [];
  const { totalCases, falsePositiveRate: fp, falseNegativeRate: fn, leakedRevenueEstimate: leak } = perf;

  if (fn >= FN_HIGH && totalCases >= 5) {
    const pri = rankPolicyProposalPriority({
      falseNegativeRate: fn,
      leakedRevenueEstimate: leak,
    });
    const conf = rankPolicyProposalConfidence({
      evidenceCount: 2,
      hasFeedbackSummary: true,
      hasCluster: false,
      hasDrift: false,
      hasSimulation: false,
    });
    out.push({
      id: nextId("thresh-fn"),
      type: "THRESHOLD_ADJUSTMENT",
      title: "Lower high-risk combined threshold band",
      description:
        "Material false-negative rate in labeled feedback suggests lowering combined high-risk cutoffs or raising review sensitivity for risky actions.",
      priority: pri === "LOW" ? "MEDIUM" : pri,
      confidence: totalCases >= 24 ? "HIGH" : conf,
      target: { metricKey: "combinedRiskHigh" },
      recommendation: {
        direction: "decrease",
        proposedValue: "human_review_required",
        currentValue: "baseline_snapshot_only",
      },
      rationale: `FN rate ${(fn * 100).toFixed(2)}% across ${totalCases} cases indicates permissive posture vs downstream harmful truth.`,
      evidence: [
        evidence("feedback_summary", "performanceSummary", { metric: "falseNegativeRate", value: fn, note: `${totalCases} cases` }),
      ],
      impactEstimate: {
        expectedFalseNegativeRateDelta: -fn * 0.15,
        expectedFalsePositiveRateDelta: fp * 0.05,
      },
      reviewerNotes: ["Lower combinedRiskHigh / tighten fraud-legal weights only after staging replay."],
    });
  }

  if (leak >= LEAK_HIGH && totalCases >= 5) {
    const pri = rankPolicyProposalPriority({ leakedRevenueEstimate: leak });
    out.push({
      id: nextId("thresh-leak"),
      type: "THRESHOLD_ADJUSTMENT",
      title: "Raise review sensitivity — material estimated leakage",
      description:
        "Estimated leaked revenue implies harmful outcomes escaped governance economics — increase anomaly sensitivity or require approval earlier for high-value actions.",
      priority: leak >= LEAK_HIGH * 2 ? "HIGH" : "MEDIUM",
      confidence: rankPolicyProposalConfidence({
        evidenceCount: 2,
        hasFeedbackSummary: true,
      }),
      target: { metricKey: "anomalySensitivity" },
      recommendation: { direction: "increase", proposedValue: "risk_review_escalation" },
      rationale: `Leaked revenue estimate ${leak.toFixed(0)} exceeds materiality gate — prioritize payout/payment slices.`,
      evidence: [
        evidence("feedback_summary", "performanceSummary", { metric: "leakedRevenueEstimate", value: leak }),
      ],
      impactEstimate: { expectedLeakedRevenueDelta: -Math.min(leak * 0.2, leak) },
    });
  }

  if (fp >= 0.12 && totalCases >= 5) {
    out.push({
      id: nextId("thresh-fp"),
      type: "THRESHOLD_ADJUSTMENT",
      title: "Segment thresholds to reduce false-positive pressure",
      description:
        "High FP rate suggests global gates may be misaligned — segment by region/action before tightening numerically.",
      priority: fp >= 0.22 ? "HIGH" : "MEDIUM",
      confidence: "MEDIUM",
      target: { metricKey: "combinedRiskMedium" },
      recommendation: { direction: "review", proposedValue: "segment_by_region_action" },
      rationale: `FP rate ${(fp * 100).toFixed(2)}% — review medium threshold and approval routing.`,
      evidence: [evidence("feedback_summary", "performanceSummary", { metric: "falsePositiveRate", value: fp })],
      impactEstimate: { expectedFalsePositiveRateDelta: -fp * 0.1, expectedFalseNegativeRateDelta: fn * 0.02 },
    });
  }

  return out;
}

function proposalsFromClusters(nextId: NextProposalId, clusters: PolicyProposalInput["clusters"]): PolicyProposal[] {
  if (!clusters?.length) return [];
  const out: PolicyProposal[] = [];

  for (const c of clusters) {
    const region = c.fingerprint.regionCode;
    const action = c.fingerprint.actionType;
    const entity = c.fingerprint.entityType;
    const label = c.fingerprint.outcomeLabel ?? "";
    const highCluster = c.severity === "HIGH" || c.severity === "CRITICAL";

    if (c.severity === "CRITICAL" && c.caseCount >= REPEATED_FN_CLUSTER_MIN) {
      const type =
        region ? "REGION_POLICY_REVIEW"
        : action ? "ACTION_POLICY_REVIEW"
        : entity ? "ENTITY_POLICY_REVIEW"
        : "REGION_POLICY_REVIEW";
      out.push({
        id: nextId(`cluster-${c.clusterKey}`),
        type,
        title: `Critical cluster — ${c.clusterKey}`,
        description: `${c.caseCount} cases, leakage ${c.leakedRevenueEstimate.toFixed(0)} — tighten review posture for this slice.`,
        priority: "CRITICAL",
        confidence: rankPolicyProposalConfidence({
          evidenceCount: 2,
          hasCluster: true,
        }),
        target: { regionCode: region, actionType: action, entityType: entity },
        recommendation: { direction: "review", proposedValue: "documented_exception" },
        rationale: c.recommendedActions?.length
          ? c.recommendedActions.slice(0, 2).join(" ")
          : "Repeated CRITICAL severity in one fingerprint requires human policy review.",
        evidence: [
          evidence("case_cluster", c.clusterKey, { metric: "caseCount", value: c.caseCount, note: `severity=${c.severity}` }),
          evidence("case_cluster", c.clusterKey, { metric: "leakedRevenueEstimate", value: c.leakedRevenueEstimate }),
        ],
        impactEstimate: { expectedLeakedRevenueDelta: -c.leakedRevenueEstimate * 0.2 },
        reviewerNotes: c.affectedRuleIds.length ? [`Rules: ${c.affectedRuleIds.slice(0, 6).join(", ")}`] : undefined,
      });
    }

    if (
      highCluster &&
      c.falseNegativeCount >= REPEATED_FN_CLUSTER_MIN &&
      (label === "MISSED_RISK" || label === "BAD_EXECUTION") &&
      c.affectedRuleIds.length === 0
    ) {
      out.push({
        id: nextId(`newrule-blind-${c.clusterKey}`),
        type: "NEW_RULE",
        title: `Explicit escalation for blind spot — ${c.clusterKey}`,
        description:
          "Cluster repeats harmful outcomes without traced rule IDs — add payout/payment/listing escalation drafted by policy owners.",
        priority: c.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        confidence: "LOW",
        target: { regionCode: region, actionType: action, entityType: entity },
        recommendation: {
          direction: "add",
          proposedRuleExpression:
            "[draft_required] escalation WHEN payout_volume_high AND anomaly_signals THEN REQUIRE_APPROVAL",
        },
        rationale:
          "Evidence suggests a governance blind spot — propose human-authored rule text; no ML-generated logic in v1.",
        evidence: [
          evidence("case_cluster", c.clusterKey, { metric: "falseNegativeCount", value: c.falseNegativeCount }),
          evidence("case_cluster", c.clusterKey, { metric: "affectedRuleIds", value: "none", note: "blind_spot" }),
        ],
        impactEstimate: { expectedFalseNegativeRateDelta: -0.06, expectedFalsePositiveRateDelta: 0.03 },
        reviewerNotes: ["Do not auto-deploy rule expression — legal/product sign-off required."],
      });
    }

    if (label === "MISSED_RISK" && c.leakedRevenueEstimate > 0 && c.caseCount >= REPEATED_FN_CLUSTER_MIN) {
      out.push({
        id: nextId(`newrule-mr-${c.clusterKey}`),
        type: "NEW_RULE",
        title: `Region/action approval rule — ${c.clusterKey}`,
        description:
          "Repeated MISSED_RISK with leakage — add region/action-specific approval for LISTING_PUBLISH / PAYMENT-class actions after human drafting.",
        priority: c.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        confidence: "MEDIUM",
        target: { regionCode: region, actionType: action, entityType: entity },
        recommendation: {
          direction: "add",
          proposedRuleExpression: "[draft_required] LISTING_PUBLISH|PAYOUT_HIGH_VALUE → REQUIRE_APPROVAL",
        },
        rationale: "Deterministic advisory template — replace tokens with approved policy DSL.",
        evidence: [evidence("case_cluster", c.clusterKey, { metric: "outcomeLabel", value: label })],
        impactEstimate: { expectedFalseNegativeRateDelta: -0.05 },
      });
    }

    if (entity && c.falseNegativeCount >= 2 && (label === "MISSED_RISK" || label === "BAD_EXECUTION")) {
      out.push({
        id: nextId(`entity-${c.clusterKey}`),
        type: "ENTITY_POLICY_REVIEW",
        title: `Specialized safeguards for entity class ${entity}`,
        description:
          "Harmful clusters concentrate on one entity type (booking/payout/listing) — review entity-scoped safeguards.",
        priority: "MEDIUM",
        confidence: "LOW",
        target: { entityType: entity, regionCode: region },
        recommendation: { direction: "review" },
        rationale: "Repeated harm on same entityType merits targeted policy review.",
        evidence: [evidence("case_cluster", c.clusterKey, { metric: "entityType", value: entity })],
        impactEstimate: {},
      });
    }
  }

  return out;
}

function proposalsClusterRuleOrder(
  nextId: NextProposalId,
  clusters: PolicyProposalInput["clusters"],
  driftAlerts: PolicyProposalInput["driftAlerts"],
): PolicyProposal[] {
  if (!clusters?.length || !driftAlerts?.length) return [];
  const worseningFnOrFp = driftAlerts.some(
    (d) =>
      d.severity !== "INFO" &&
      (d.metric === "falseNegativeRate" || d.metric === "falsePositiveRate") &&
      Math.abs(d.delta) > 0.05,
  );
  if (!worseningFnOrFp) return [];

  const out: PolicyProposal[] = [];
  for (const c of clusters) {
    if (c.affectedRuleIds.length === 0) continue;
    out.push({
      id: nextId(`rule-order-${c.clusterKey}`),
      type: "RULE_ORDER_REVIEW",
      title: `Reorder gates affecting rules [${c.affectedRuleIds.slice(0, 3).join(", ")}]`,
      description:
        "Clusters cite affected rules while drift shows rising FN/FP — move hard block earlier or defer warning fallback until after value checks.",
      priority: "MEDIUM",
      confidence: rankPolicyProposalConfidence({
        evidenceCount: 2 + c.affectedRuleIds.length,
        hasCluster: true,
        hasDrift: true,
      }),
      target: { ruleId: c.affectedRuleIds[0], regionCode: c.fingerprint.regionCode, actionType: c.fingerprint.actionType },
      recommendation: {
        direction: "reorder",
        proposedValue: "move_hard_block_earlier_or_warning_later",
      },
      rationale:
        "Ordering changes are lower risk than blind threshold shifts when rule IDs are known — human pipeline review only.",
      evidence: [
        ...c.affectedRuleIds.slice(0, 5).map((rid) => evidence("case_cluster", c.clusterKey, { metric: "ruleId", value: rid })),
        evidence("drift_alert", "aggregate", { note: "fn_fp_drift_present" }),
      ],
      impactEstimate: {},
      reviewerNotes: ["Validate with execution traces before changing pipeline order."],
    });
  }
  return out;
}

function proposalsFromDrift(nextId: NextProposalId, alerts: PolicyProposalInput["driftAlerts"]): PolicyProposal[] {
  if (!alerts?.length) return [];
  const out: PolicyProposal[] = [];

  for (const a of alerts) {
    if (a.severity === "INFO") continue;

    const pri = rankPolicyProposalPriority({
      driftSeverity: a.severity,
      falseNegativeRate: a.metric === "falseNegativeRate" ? Math.abs(a.delta) : undefined,
      falsePositiveRate: a.metric === "falsePositiveRate" ? Math.abs(a.delta) : undefined,
    });

    let type: PolicyProposal["type"] = "THRESHOLD_ADJUSTMENT";
    if (a.dimension === "regionCode") type = "REGION_POLICY_REVIEW";
    else if (a.dimension === "actionType") type = "ACTION_POLICY_REVIEW";
    else if (a.dimension === "entityType") type = "ENTITY_POLICY_REVIEW";

    const title =
      a.dimension === "regionCode" ? `Tighten review posture — region ${a.dimensionValue}`
      : a.dimension === "actionType" ? `Stricter approval — action ${a.dimensionValue}`
      : a.dimension === "entityType" ? `Entity safeguards — ${a.dimensionValue}`
      : `Drift on ${a.metric}`;

    out.push({
      id: nextId(`drift-${a.alertKey}`),
      type,
      title,
      description: `Drift ${a.dimension}=${a.dimensionValue}: ${a.baselineValue.toFixed(4)} → ${a.currentValue.toFixed(4)} (Δ ${a.delta.toFixed(4)}).`,
      priority: pri === "LOW" ? "MEDIUM" : pri,
      confidence: a.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
      target: {
        metricKey: a.metric,
        ...(a.dimension === "regionCode" ? { regionCode: a.dimensionValue }
        : a.dimension === "actionType" ? { actionType: a.dimensionValue }
        : a.dimension === "entityType" ? { entityType: a.dimensionValue }
        : {}),
      },
      recommendation: { direction: "review", currentValue: a.baselineValue, proposedValue: a.currentValue },
      rationale:
        "Drift indicates governance outcomes diverging — schedule human review; no automated writes.",
      evidence: [
        evidence("drift_alert", a.alertKey, {
          metric: a.metric,
          value: a.delta,
          note: `severity=${a.severity}`,
        }),
      ],
      impactEstimate:
        a.metric === "falseNegativeRate" ?
          { expectedFalseNegativeRateDelta: -Math.abs(a.delta) * 0.4 }
        : a.metric === "falsePositiveRate" ?
          { expectedFalsePositiveRateDelta: -Math.abs(a.delta) * 0.4 }
        : {},
      reviewerNotes: a.recommendedActions?.slice(0, 3),
    });

    if (
      a.dimension === "actionType" &&
      (a.metric === "falseNegativeRate" || a.metric === "leakedRevenueEstimate") &&
      a.severity !== "INFO"
    ) {
      out.push({
        id: nextId(`action-drift-${a.alertKey}`),
        type: "ACTION_POLICY_REVIEW",
        title: `Stricter approval requirement — ${a.dimensionValue}`,
        description:
          "Action type repeats in drift for missed risk / leakage — adopt staged approval for PAYOUT / PAYMENT / LISTING_PUBLISH-class actions.",
        priority: a.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        confidence: "MEDIUM",
        target: { actionType: a.dimensionValue },
        recommendation: { direction: "increase", proposedValue: "REQUIRE_APPROVAL_for_high_value" },
        rationale: "Single-action drift dominance suggests targeted gate before global threshold moves.",
        evidence: [evidence("drift_alert", a.alertKey, { metric: a.metric, value: a.delta })],
        impactEstimate: {},
      });
    }
  }

  return out;
}

function proposalsFromSimulation(nextId: NextProposalId, sim?: PolicyProposalInput["simulationReport"]): PolicyProposal[] {
  if (!sim?.scenarios?.length) return [];
  const out: PolicyProposal[] = [];

  const bestId = sim.bestScenarioId;
  const best = sim.scenarios.find((s) => s.configId === bestId);

  if (best && bestId && bestId !== sim.baseline.configId) {
    const fpOk = !unacceptableSimulationFpIncrease(best.delta.falsePositiveRate);
    const leakedImproves = best.delta.leakedRevenue < 0;
    const fnImproves = best.delta.falseNegativeRate < 0;

    if ((leakedImproves || fnImproves) && fpOk) {
      out.push({
        id: nextId("sim-best"),
        type: "THRESHOLD_ADJUSTMENT",
        title: `Adopt simulation scenario "${bestId}" (staging only)`,
        description:
          "Sandbox scenario improves leakage or FN without unacceptable FP increase — replicate thresholds in staging.",
        priority: leakedImproves && fnImproves ? "HIGH" : "MEDIUM",
        confidence: rankPolicyProposalConfidence({
          evidenceCount: 3,
          hasSimulation: true,
          hasFeedbackSummary: true,
        }),
        target: { metricKey: "policySimulationConfig" },
        recommendation: {
          direction: "review",
          currentValue: sim.baseline.configId,
          proposedValue: bestId,
        },
        rationale: `Δleaked ${best.delta.leakedRevenue.toFixed(2)}, ΔFN rate ${best.delta.falseNegativeRate.toFixed(4)}, ΔFP rate ${best.delta.falsePositiveRate.toFixed(4)} (FP guard applied).`,
        evidence: [
          evidence("simulation_result", sim.baseline.configId, { metric: "baseline", value: sim.baseline.configId }),
          evidence("simulation_result", bestId, { metric: "scenario", value: bestId }),
        ],
        impactEstimate: buildImpactEstimateFromSimulationScenarioDelta(best.delta),
        reviewerNotes: ["Discard if unified-governance replay disagrees — score engine ≠ production fidelity."],
      });
    }
  }

  if (sim.scenarios.length >= 2) {
    out.push({
      id: nextId("sim-order"),
      type: "RULE_ORDER_REVIEW",
      title: "Simulation trade-offs — review gate ordering before numeric tweaks",
      description:
        "Multiple scenarios trade FP/FN — evaluate moving hard block earlier vs warning fallback later.",
      priority: "MEDIUM",
      confidence: "LOW",
      target: {},
      recommendation: { direction: "reorder", proposedValue: "pipeline_audit" },
      rationale: "Ordering dominates when simulations disagree — advisory narrative review.",
      evidence: sim.scenarios.slice(0, 5).map((s) =>
        evidence("simulation_result", s.configId, { metric: "falseNegativeRate", value: s.falseNegativeRate }),
      ),
      impactEstimate: {},
    });
  }

  return out;
}

export function generatePolicyProposals(input: PolicyProposalInput): PolicyProposal[] {
  try {
    let seq = 0;
    const nextId: NextProposalId = (kind) => {
      seq += 1;
      return `policy-proposal-v1-${seq.toString().padStart(5, "0")}-${kind}`;
    };

    const clusters = input.clusters ?? [];
    const drift = input.driftAlerts ?? [];

    return [
      ...proposalsFromPerformanceSummary(nextId, input.performanceSummary),
      ...proposalsFromClusters(nextId, clusters),
      ...proposalsClusterRuleOrder(nextId, clusters, drift),
      ...proposalsFromDrift(nextId, drift),
      ...proposalsFromSimulation(nextId, input.simulationReport),
    ];
  } catch {
    return [];
  }
}

export function buildPolicyProposalInputFromSignals(args: {
  performanceSummary?: GovernancePerformanceSummary | null;
  intelligence?: GovernanceIntelligenceAnalysis | null;
  simulationReport?: PolicySimulationComparisonReport | null;
}): PolicyProposalInput {
  try {
    const performanceSummary = args.performanceSummary
      ? {
          totalCases: args.performanceSummary.totalCases,
          falsePositiveRate: args.performanceSummary.falsePositiveRate,
          falseNegativeRate: args.performanceSummary.falseNegativeRate,
          protectedRevenueEstimate: args.performanceSummary.protectedRevenueEstimate,
          leakedRevenueEstimate: args.performanceSummary.leakedRevenueEstimate,
        }
      : undefined;

    const clusters = args.intelligence?.clusters?.map((c: GovernanceIntelligenceCluster) =>
      mapIntelligenceClusterToInput(c),
    );

    const driftAlerts = args.intelligence?.driftAlerts?.map((d: GovernanceIntelligenceDriftAlert) =>
      mapIntelligenceDriftToInput(d),
    );

    const simulationReport = args.simulationReport
      ? {
          baseline: {
            configId: args.simulationReport.baseline.configId,
            falsePositiveRate: args.simulationReport.baseline.falsePositiveRate,
            falseNegativeRate: args.simulationReport.baseline.falseNegativeRate,
            protectedRevenue: args.simulationReport.baseline.protectedRevenue,
            leakedRevenue: args.simulationReport.baseline.leakedRevenue,
          },
          scenarios: args.simulationReport.scenarios.map((s) => ({
            configId: s.configId,
            falsePositiveRate: s.falsePositiveRate,
            falseNegativeRate: s.falseNegativeRate,
            protectedRevenue: s.protectedRevenue,
            leakedRevenue: s.leakedRevenue,
            delta: { ...s.delta },
          })),
          bestScenarioId: args.simulationReport.bestScenarioId,
        }
      : undefined;

    return {
      performanceSummary,
      clusters,
      driftAlerts,
      simulationReport,
    };
  } catch {
    return {};
  }
}

function mapIntelligenceClusterToInput(c: GovernanceIntelligenceCluster): NonNullable<PolicyProposalInput["clusters"]>[number] {
  const parts = c.dimension.split("·").map((s) => s.trim());
  const actionGuess = parts[0]?.includes("_") || /^[A-Z_]+$/.test(parts[0] ?? "") ? parts[0] : undefined;
  const regionGuess = parts[1]?.match(/^[a-z]{2}_/i) ? parts[1] : undefined;

  return {
    clusterKey: c.id,
    caseCount: c.caseCount,
    falsePositiveCount: c.labelFocus === "BAD_BLOCK" ? c.caseCount : 0,
    falseNegativeCount:
      c.labelFocus === "MISSED_RISK" || c.labelFocus === "BAD_APPROVAL" || c.labelFocus === "BAD_EXECUTION" ?
        c.caseCount
      : 0,
    leakedRevenueEstimate: c.leakedRevenueSum,
    protectedRevenueEstimate: 0,
    affectedRuleIds: [],
    severity:
      c.severity === "CRITICAL" ? "CRITICAL"
      : c.severity === "WARNING" ? "HIGH"
      : "LOW",
    fingerprint: {
      regionCode: regionGuess,
      actionType: actionGuess,
      outcomeLabel: c.labelFocus,
    },
    recommendedActions: [c.rationale],
  };
}

function mapIntelligenceDriftToInput(d: GovernanceIntelligenceDriftAlert): NonNullable<PolicyProposalInput["driftAlerts"]>[number] {
  return {
    alertKey: d.id,
    dimension: "policyDecision",
    dimensionValue: "harmful_outcome_rate_window",
    metric: "falseNegativeRate",
    baselineValue: d.baselineRate,
    currentValue: d.recentRate,
    delta: d.delta,
    severity: d.severity === "WARNING" ? "WARNING" : "CRITICAL",
    recommendedActions: [d.rationale],
  };
}
