/**
 * Deterministic explainability for listing preview — no LLM, no randomness, no I/O.
 */

import type { MarketplaceSignal, ObservationSnapshot, Opportunity, PolicyDecision, ProposedAction } from "../types/domain.types";
import type {
  ExplanationEdge,
  ExplanationGraph,
  ExplanationLevel,
  ExplanationNode,
  ListingExplanation,
  UserSafeListingReasoning,
} from "./explainability.types";

const MAX_NODES = 20;
const MAX_EDGES = 30;

export type BuildListingExplanationParams = {
  listingId: string;
  signals: MarketplaceSignal[];
  opportunities: Opportunity[];
  policyDecisions: PolicyDecision[];
  proposedActions: ProposedAction[];
  observation: ObservationSnapshot;
  level?: ExplanationLevel;
  /** When true, attach policy rule codes to policy nodes (admin/debug). */
  includeDebugRuleRefs?: boolean;
};

function sortedStrings(xs: string[]): string[] {
  return [...xs].sort((a, b) => a.localeCompare(b));
}

function opportunityForAction(opportunities: Opportunity[], actionId: string): Opportunity | undefined {
  for (const o of opportunities) {
    if (o.proposedActions.some((a) => a.id === actionId)) return o;
  }
  return undefined;
}

function dispositionLabel(d: PolicyDecision["disposition"]): string {
  switch (d) {
    case "BLOCK":
      return "blocked";
    case "ALLOW":
      return "allowed";
    case "ALLOW_WITH_APPROVAL":
      return "requires approval";
    case "ALLOW_DRY_RUN":
      return "dry-run only";
    default:
      return String(d);
  }
}

function signalTitle(s: MarketplaceSignal): string {
  return `Signal: ${s.signalType}`;
}

function signalDescription(s: MarketplaceSignal): string {
  const base = s.explanation?.trim() || "Normalized marketplace signal from observation.";
  if (base.length > 220) return `${base.slice(0, 217)}…`;
  return base;
}

function buildSummary(params: {
  listingId: string;
  signalCount: number;
  opportunityCount: number;
  actionCount: number;
  observationMock: boolean;
}): string {
  const mockNote = params.observationMock ? " Preview used fallback observation where listing data was partial." : "";
  if (params.signalCount === 0 && params.opportunityCount === 0 && params.actionCount === 0) {
    return `Listing ${params.listingId}: preview found no detector opportunities in dry-run mode — policy was not applied to actions.${mockNote}`;
  }
  return `Listing ${params.listingId}: preview evaluated ${params.signalCount} observation signal(s), ${params.opportunityCount} detector opportunity(ies), and ${params.actionCount} proposed action(s); all outcomes are dry-run only with no execution.${mockNote}`;
}

function keyFindingsFrom(
  signals: MarketplaceSignal[],
  opportunities: Opportunity[],
  level: ExplanationLevel,
): string[] {
  const out: string[] = [];
  const sigSorted = sortedStrings(signals.map((s) => s.id)).slice(0, 8);
  for (const sid of sigSorted) {
    const s = signals.find((x) => x.id === sid);
    if (!s) continue;
    out.push(`${s.signalType}: ${signalDescription(s)}`);
    if (out.length >= 3) break;
  }
  const oppTitles = sortedStrings(opportunities.map((o) => o.title)).slice(0, 8);
  for (const t of oppTitles) {
    out.push(`Opportunity: ${t}`);
    if (out.length >= 5) break;
  }
  if ((level === "detailed" || level === "debug") && out.length < 5 && opportunities.length > 0) {
    const sortedOpp = [...opportunities].sort((a, b) => a.id.localeCompare(b.id));
    for (const o of sortedOpp) {
      out.push(`Detector ${o.detectorId}: confidence ${o.confidence.toFixed(2)}`);
      if (out.length >= 5) break;
    }
  }
  return out.slice(0, 5);
}

function recommendationsFrom(
  policyDecisions: PolicyDecision[],
  proposedActions: ProposedAction[],
): string[] {
  const recs: string[] = [];
  const n = Math.min(policyDecisions.length, proposedActions.length);
  for (let i = 0; i < n; i++) {
    const p = policyDecisions[i];
    const a = proposedActions[i];
    if (!p || !a) continue;
    const disp = dispositionLabel(p.disposition);
    if (p.disposition === "BLOCK") {
      recs.push(`Review policy gates for action type ${a.type} — current disposition is ${disp}.`);
    } else if (p.disposition === "ALLOW_WITH_APPROVAL") {
      recs.push(`Action ${a.type} may proceed only after explicit approval — preview does not execute.`);
    } else if (p.disposition === "ALLOW_DRY_RUN") {
      recs.push(`Action ${a.type} remains simulation-only until governance allows execution.`);
    } else {
      recs.push(`Action ${a.type} is allowed in policy preview — still dry-run until explicitly executed elsewhere.`);
    }
    if (recs.length >= 5) break;
  }
  const seen = new Set<string>();
  return recs.filter((r) => (seen.has(r) ? false : (seen.add(r), true))).slice(0, 5);
}

export function buildListingExplanation(params: BuildListingExplanationParams): ListingExplanation {
  const level: ExplanationLevel = params.level ?? "simple";
  const listingId = params.listingId.trim() || "unknown";
  const signals = params.signals;
  const opportunities = params.opportunities;
  const policyDecisions = params.policyDecisions;
  const proposedActions = params.proposedActions;
  const observationMock = params.observation.facts?.preview === true && params.observation.facts?.mock === true;

  const summary = buildSummary({
    listingId,
    signalCount: signals.length,
    opportunityCount: opportunities.length,
    actionCount: proposedActions.length,
    observationMock: observationMock === true,
  });

  const keyFindings = keyFindingsFrom(signals, opportunities, level);
  const recommendations = recommendationsFrom(policyDecisions, proposedActions);

  const sigNodes: ExplanationNode[] = sortedStrings(signals.map((s) => s.id))
    .slice(0, 6)
    .map((id) => {
      const s = signals.find((x) => x.id === id)!;
      return {
        id: `sig_${id}`,
        type: "signal" as const,
        title: signalTitle(s),
        description: signalDescription(s),
        severity: undefined,
        references: level === "debug" ? [s.source] : undefined,
      };
    });

  const oppNodes: ExplanationNode[] = sortedStrings(opportunities.map((o) => o.id))
    .slice(0, 6)
    .map((id) => {
      const o = opportunities.find((x) => x.id === id)!;
      return {
        id: `opp_${id}`,
        type: "opportunity" as const,
        title: o.title,
        description:
          level === "simple" ? o.explanation.slice(0, 160) : o.explanation.slice(0, 400),
        severity: o.risk,
        references: level === "debug" ? [o.detectorId] : undefined,
      };
    });

  const polNodes: ExplanationNode[] = [];
  const actNodes: ExplanationNode[] = [];
  const pairLimit = Math.min(policyDecisions.length, proposedActions.length, 6);
  for (let i = 0; i < pairLimit; i++) {
    const p = policyDecisions[i];
    const a = proposedActions[i];
    if (!p || !a) continue;
    const ruleRefs =
      params.includeDebugRuleRefs === true ?
        p.ruleResults.map((r) => r.ruleCode).slice(0, 12)
      : undefined;
    polNodes.push({
      id: `pol_${p.id}`,
      type: "policy",
      title: `Policy for ${a.type}`,
      description: `Disposition: ${dispositionLabel(p.disposition)}. Violations: ${p.violations.length}; warnings: ${p.warnings.length}.`,
      severity: undefined,
      references: ruleRefs,
    });
    actNodes.push({
      id: `act_${a.id}`,
      type: "action",
      title: a.title,
      description:
        level === "simple" ? a.humanReadableSummary.slice(0, 160) : a.explanation.slice(0, 360),
      severity: a.risk,
      references: level === "debug" ? [a.type, a.sourceDetectorId] : undefined,
    });
  }

  let nodes: ExplanationNode[] = [...sigNodes, ...oppNodes, ...polNodes, ...actNodes];
  nodes = nodes.slice(0, MAX_NODES);

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: ExplanationEdge[] = [];

  /** Deterministic signal → opportunity pairing (lexicographic join). */
  const sigIds = sortedStrings(sigNodes.map((n) => n.id));
  const oppIdsSorted = sortedStrings(oppNodes.map((n) => n.id));
  for (let i = 0; i < sigIds.length && edges.length < MAX_EDGES; i++) {
    if (oppIdsSorted.length === 0) break;
    const oi = i % oppIdsSorted.length;
    const from = sigIds[i]!;
    const to = oppIdsSorted[oi]!;
    if (nodeIds.has(from) && nodeIds.has(to)) {
      edges.push({
        from,
        to,
        reason: "Observation signal informs detector opportunity ranking in preview.",
      });
    }
  }

  for (let i = 0; i < pairLimit && edges.length < MAX_EDGES; i++) {
    const p = policyDecisions[i];
    const a = proposedActions[i];
    if (!p || !a) continue;
    const opp = opportunityForAction(opportunities, a.id);
    const oppNodeId = opp ? `opp_${opp.id}` : null;
    const polId = `pol_${p.id}`;
    const actId = `act_${a.id}`;
    if (oppNodeId && nodeIds.has(oppNodeId) && nodeIds.has(polId)) {
      edges.push({
        from: oppNodeId,
        to: polId,
        reason: "Detector opportunity links to policy evaluation for its proposed action.",
      });
    }
    if (nodeIds.has(polId) && nodeIds.has(actId)) {
      edges.push({
        from: polId,
        to: actId,
        reason: `Policy outcome (${dispositionLabel(p.disposition)}) constrains the proposed action in preview.`,
      });
    }
  }

  const graph: ExplanationGraph = {
    nodes,
    edges: edges.slice(0, MAX_EDGES),
  };

  return {
    listingId,
    summary,
    keyFindings,
    graph,
    recommendations,
    level,
  };
}

export function buildUserSafeListingReasoning(explanation: ListingExplanation): UserSafeListingReasoning {
  return {
    summary: `${explanation.summary} Improving listing details and trust signals can support visibility and conversion — changes require your review; nothing runs automatically from preview.`,
  };
}

export function emptyListingExplanation(listingId: string, level: ExplanationLevel): ListingExplanation {
  return {
    listingId: listingId.trim() || "unknown",
    summary: "No preview explanation could be built — insufficient structured signals.",
    keyFindings: [],
    graph: { nodes: [], edges: [] },
    recommendations: [],
    level,
  };
}
