/**
 * Phase B — controlled swarm influence (advisory overlay only).
 * Does not mutate source proposals; operates on copies with optional `influenceOverlay`.
 */
import { logInfo } from "@/lib/logger";
import { buildSwarmDecisionBundle } from "./swarm-decision-bundle.service";
import type {
  SwarmAgentOutput,
  SwarmAggregateScores,
  SwarmConflict,
  SwarmDecisionBundle,
  SwarmInfluenceOverlay,
  SwarmInfluenceReport,
  SwarmNegotiationResult,
  SwarmNegotiationStatus,
  SwarmProposal,
} from "./swarm-system.types";

const NS = "[swarm:v1:influence]";

/** Max absolute rank adjustment (fraction of priority scale) — ~12% equivalent. */
export const SWARM_INFLUENCE_MAX_RANK_DELTA = 0.12;

const CRITICAL_AGENT_IDS = ["ads", "cro", "brain", "operator", "platform_core"] as const;

function cloneProposal(p: SwarmProposal): SwarmProposal {
  return {
    ...p,
    sourceSystems: [...p.sourceSystems],
    blockers: [...p.blockers],
    dependencies: [...p.dependencies],
    targetEntity: p.targetEntity ? { ...p.targetEntity } : undefined,
    influenceOverlay: undefined,
  };
}

function emptyOverlay(): SwarmInfluenceOverlay {
  return { tags: [], rankAdjustment: 0 };
}

function capRankDelta(n: number): number {
  return Math.max(-SWARM_INFLUENCE_MAX_RANK_DELTA, Math.min(SWARM_INFLUENCE_MAX_RANK_DELTA, n));
}

function conflictsForProposal(conflicts: SwarmConflict[], proposalId: string): SwarmConflict[] {
  return conflicts.filter((c) => c.proposalIds.includes(proposalId));
}

export function evaluateSwarmInfluenceQualityGates(input: {
  agentOutputs: SwarmAgentOutput[];
  bundle: SwarmDecisionBundle;
  scores: SwarmAggregateScores;
}): { ok: boolean; reason: string; successfulAgents: number; failedAgents: number; criticalPresent: number } {
  const failedAgents = input.agentOutputs.filter((o) => o.failureReason).length;
  const successfulAgents = input.agentOutputs.length - failedAgents;
  const criticalPresent = CRITICAL_AGENT_IDS.filter((id) =>
    input.agentOutputs.some((o) => o.agentId === id && !o.failureReason),
  ).length;

  if (input.bundle.opportunities.length === 0) {
    return { ok: false, reason: "no_proposals", successfulAgents, failedAgents, criticalPresent };
  }
  if (failedAgents > 3) {
    return { ok: false, reason: "too_many_agent_failures", successfulAgents, failedAgents, criticalPresent };
  }
  if (successfulAgents < 5) {
    return { ok: false, reason: "insufficient_agent_coverage", successfulAgents, failedAgents, criticalPresent };
  }
  if (criticalPresent < 3) {
    return { ok: false, reason: "critical_agents_missing", successfulAgents, failedAgents, criticalPresent };
  }
  if (input.scores.evidenceScore < 0.28) {
    return { ok: false, reason: "low_evidence_score", successfulAgents, failedAgents, criticalPresent };
  }
  const conflictDensity =
    input.bundle.opportunities.length > 0 ? input.bundle.conflicts.length / input.bundle.opportunities.length : 0;
  if (conflictDensity > 0.85 && input.bundle.opportunities.length > 2) {
    return { ok: false, reason: "extreme_conflict_density", successfulAgents, failedAgents, criticalPresent };
  }
  if (input.scores.agreementScore < 0.32 && input.bundle.conflicts.length > 6) {
    return { ok: false, reason: "agreement_too_low_with_many_conflicts", successfulAgents, failedAgents, criticalPresent };
  }

  return { ok: true, reason: "ok", successfulAgents, failedAgents, criticalPresent };
}

function sortProposalsForInfluence(
  proposals: SwarmProposal[],
  negotiationById: Map<string, SwarmNegotiationStatus>,
): SwarmProposal[] {
  const order: SwarmNegotiationStatus[] = [
    "proceed",
    "proceed_with_caution",
    "monitor_only",
    "defer",
    "blocked",
    "require_human_review",
  ];
  const byBucket = new Map<SwarmNegotiationStatus, SwarmProposal[]>();
  for (const s of order) byBucket.set(s, []);

  for (const p of proposals) {
    const st = negotiationById.get(p.id) ?? "monitor_only";
    byBucket.get(st)!.push(p);
  }

  const eff = (p: SwarmProposal) => p.priority + (p.influenceOverlay?.rankAdjustment ?? 0);

  for (const s of order) {
    byBucket.get(s)!.sort((a, b) => eff(b) - eff(a));
  }

  return order.flatMap((s) => byBucket.get(s)!);
}

function buildObservationalWarnings(input: {
  report: SwarmInfluenceReport;
  proposals: number;
  conflicts: SwarmConflict[];
  boostsOnConflicted: number;
  dominantAgentBoosts: Record<string, number>;
}): string[] {
  const w: string[] = [];
  const { report, proposals: n, conflicts, boostsOnConflicted, dominantAgentBoosts } = input;
  if (report.applied && report.itemsInfluencedCount > 0 && n > 0 && report.itemsInfluencedCount / n > 0.55) {
    w.push("swarm_influence: many items adjusted in one cycle — review for stability.");
  }
  if (report.applied && boostsOnConflicted > 0) {
    w.push("swarm_influence: agreement boost applied while proposal had negotiation conflicts — verify.");
  }
  if (conflicts.length > 3 && report.conflictCautionCount === 0 && report.applied) {
    w.push("swarm_influence: high conflict count but few caution tags — review negotiation overlay.");
  }
  const dom = Object.entries(dominantAgentBoosts).sort((a, b) => b[1] - a[1])[0];
  if (dom && dom[1] >= 4) {
    w.push(`swarm_influence: agent ${dom[0]} received repeated boosts — check for dominance.`);
  }
  return w;
}

export function applySwarmInfluence(input: {
  influenceEnabled: boolean;
  agentOutputs: SwarmAgentOutput[];
  swarmScores: SwarmAggregateScores;
  swarmConflicts: SwarmConflict[];
  swarmNegotiationResults: SwarmNegotiationResult[];
  swarmDecisionBundle: SwarmDecisionBundle;
}): { influencedBundle: SwarmDecisionBundle | null; report: SwarmInfluenceReport | null } {
  const baseReport = (): SwarmInfluenceReport => ({
    applied: false,
    qualityGatesOk: false,
    agreementBoostCount: 0,
    conflictCautionCount: 0,
    humanReviewEscalationCount: 0,
    lowEvidenceMonitorCount: 0,
    deferOrBlockedTagCount: 0,
    itemsInfluencedCount: 0,
    skippedInfluenceCount: 0,
    reasonSummary: "",
    agentCoverageSummary: "",
    observationalWarnings: [],
  });

  if (!input.influenceEnabled) {
    return { influencedBundle: null, report: null };
  }

  const gates = evaluateSwarmInfluenceQualityGates({
    agentOutputs: input.agentOutputs,
    bundle: input.swarmDecisionBundle,
    scores: input.swarmScores,
  });

  const agentCoverageSummary = `${gates.successfulAgents}/8 agents ok · critical=${gates.criticalPresent}/5`;

  if (!gates.ok) {
    const r = baseReport();
    r.skippedReason = gates.reason;
    r.qualityGatesOk = false;
    r.reasonSummary = `Quality gates failed: ${gates.reason}.`;
    r.agentCoverageSummary = agentCoverageSummary;
    r.skippedInfluenceCount = input.swarmDecisionBundle.opportunities.length;
    logInfo(NS, {
      event: "influence_skipped",
      influenceEnabled: true,
      qualityGatesOk: false,
      skippedReason: gates.reason,
      agentCoverageSummary,
    });
    return { influencedBundle: null, report: r };
  }

  const negById = new Map(input.swarmNegotiationResults.map((n) => [n.proposalId, n.status]));
  const scores = input.swarmScores;

  const clones = input.swarmDecisionBundle.opportunities.map((p) => {
    const c = cloneProposal(p);
    c.influenceOverlay = emptyOverlay();
    return c;
  });

  let agreementBoostCount = 0;
  let conflictCautionCount = 0;
  let humanReviewEscalationCount = 0;
  let lowEvidenceMonitorCount = 0;
  let deferOrBlockedTagCount = 0;
  let skippedInfluenceCount = 0;
  let itemsInfluencedCount = 0;
  let boostsOnConflicted = 0;
  const dominantAgentBoosts: Record<string, number> = {};

  const allowBoost =
    scores.agreementScore >= 0.42 &&
    scores.executionSuitability >= 0.38 &&
    gates.successfulAgents >= 6 &&
    input.swarmConflicts.length / Math.max(input.swarmDecisionBundle.opportunities.length, 1) < 0.65;

  for (const p of clones) {
    const overlay = p.influenceOverlay!;
    const status = negById.get(p.id) ?? "monitor_only";
    const propConflicts = conflictsForProposal(input.swarmConflicts, p.id);
    let changed = false;
    const mark = () => {
      changed = true;
    };

    if (!p.id || p.rationale === undefined) {
      skippedInfluenceCount += 1;
      p.influenceOverlay = undefined;
      continue;
    }

    if (p.evidenceQuality < 0.38) {
      overlay.tags.push("low_evidence");
      overlay.tags.push("monitor_only");
      lowEvidenceMonitorCount += 1;
      mark();
    }

    const highRisk = p.risk > 0.68 || scores.swarmRisk > 0.72;
    const weakExec = scores.executionSuitability < 0.36 || scores.swarmReadiness < 0.35;
    const depsBlock = p.dependencies.length > 4;

    if (highRisk && weakExec) {
      overlay.rankAdjustment = capRankDelta(overlay.rankAdjustment - 0.06);
      overlay.tags.push("defer_advisory");
      deferOrBlockedTagCount += 1;
      mark();
    } else if (propConflicts.length >= 2 || (status === "proceed" && propConflicts.length >= 1 && p.risk > 0.62)) {
      overlay.rankAdjustment = capRankDelta(overlay.rankAdjustment - 0.05);
      overlay.tags.push("conflict_caution");
      conflictCautionCount += 1;
      mark();
    }

    const needsHumanReview =
      (propConflicts.length >= 2 && p.evidenceQuality < 0.55) ||
      (scores.agreementScore < 0.55 && propConflicts.length > 0 && p.evidenceQuality < 0.5 && status === "proceed");

    if (needsHumanReview && !overlay.tags.includes("require_human_review")) {
      overlay.tags.push("require_human_review");
      humanReviewEscalationCount += 1;
      mark();
    }

    const hasBlockOrEscalation =
      overlay.tags.includes("conflict_caution") ||
      overlay.tags.includes("require_human_review") ||
      overlay.tags.includes("defer_advisory");

    const boostEligible =
      allowBoost &&
      status === "proceed" &&
      propConflicts.length <= 1 &&
      p.evidenceQuality >= 0.52 &&
      p.risk < 0.58 &&
      !hasBlockOrEscalation &&
      !overlay.tags.includes("low_evidence");

    if (boostEligible) {
      if (propConflicts.length > 0) boostsOnConflicted += 1;
      overlay.rankAdjustment = capRankDelta(overlay.rankAdjustment + 0.08);
      overlay.tags.push("agreement_boost");
      agreementBoostCount += 1;
      dominantAgentBoosts[p.agentId] = (dominantAgentBoosts[p.agentId] ?? 0) + 1;
      mark();
    } else if (status === "proceed" && propConflicts.length <= 1 && p.evidenceQuality >= 0.52 && !allowBoost) {
      skippedInfluenceCount += 1;
    }

    if (depsBlock && !overlay.tags.includes("conflict_caution")) {
      overlay.tags.push("dependency_watch");
      mark();
    }

    if (changed) {
      itemsInfluencedCount += 1;
    }

    const uniqTags = [...new Set(overlay.tags)];
    const rank = overlay.rankAdjustment;
    if (uniqTags.length === 0 && rank === 0) {
      p.influenceOverlay = undefined;
    } else {
      p.influenceOverlay = { tags: uniqTags, rankAdjustment: rank };
    }
  }

  const negotiationById = new Map<string, SwarmNegotiationStatus>();
  for (const n of input.swarmNegotiationResults) {
    negotiationById.set(n.proposalId, n.status);
  }
  const sorted = sortProposalsForInfluence(clones, negotiationById);

  const influencedBundle = buildSwarmDecisionBundle({
    proposals: sorted,
    conflicts: input.swarmConflicts,
    negotiationResults: input.swarmNegotiationResults,
    scores: input.swarmScores,
    agentsRun: input.swarmDecisionBundle.meta.agentsRun,
    readinessSummary: input.swarmDecisionBundle.meta.readinessSummary,
    influenceApplied: true,
  });

  const reasonSummary = [
    `boosts=${agreementBoostCount}`,
    `caution=${conflictCautionCount}`,
    `human_review=${humanReviewEscalationCount}`,
    `monitor=${lowEvidenceMonitorCount}`,
    `defer_tags=${deferOrBlockedTagCount}`,
  ].join(" · ");

  const report: SwarmInfluenceReport = {
    applied: true,
    qualityGatesOk: true,
    agreementBoostCount,
    conflictCautionCount,
    humanReviewEscalationCount,
    lowEvidenceMonitorCount,
    deferOrBlockedTagCount,
    itemsInfluencedCount,
    skippedInfluenceCount,
    reasonSummary,
    agentCoverageSummary,
    observationalWarnings: [],
  };

  if (gates.successfulAgents < 6) {
    report.observationalWarnings.push("swarm_influence: applied with borderline agent coverage.");
  }

  report.observationalWarnings.push(
    ...buildObservationalWarnings({
      report,
      proposals: clones.length,
      conflicts: input.swarmConflicts,
      boostsOnConflicted,
      dominantAgentBoosts,
    }),
  );

  logInfo(NS, {
    event: "influence_applied",
    influenceEnabled: true,
    qualityGatesOk: true,
    agreementBoostCount,
    conflictCautionCount,
    humanReviewEscalationCount,
    lowEvidenceMonitorCount,
    deferOrBlockedTagCount,
    itemsInfluencedCount,
    skippedInfluenceCount,
    reasonSummary,
    agentCoverageSummary,
  });

  return { influencedBundle, report };
}
