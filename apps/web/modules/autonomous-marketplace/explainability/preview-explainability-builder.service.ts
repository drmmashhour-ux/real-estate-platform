/**
 * Deterministic preview explanation graph — no LLM; bounded size.
 */

import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type {
  MarketplaceSignal,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  ProposedAction,
} from "../types/domain.types";
import type {
  ListingPreviewExplanation,
  ListingPreviewExplanationEdge,
  ListingPreviewExplanationNode,
  ListingPreviewKeyFinding,
  ListingPreviewRecommendation,
} from "./preview-explainability.types";

const MAX_NODES = 25;
const MAX_EDGES = 35;

export function emptyListingPreviewExplanation(listingId: string): ListingPreviewExplanation {
  return {
    summary:
      "[Preview read-only] Observation data was assembled; no explainable findings were produced for this listing.",
    keyFindings: [],
    recommendations: [],
    graph: { nodes: [], edges: [] },
  };
}

function pushNode(nodes: ListingPreviewExplanationNode[], seen: Set<string>, node: ListingPreviewExplanationNode): void {
  if (nodes.length >= MAX_NODES) return;
  if (seen.has(node.id)) return;
  seen.add(node.id);
  nodes.push(node);
}

function pushEdge(edges: ListingPreviewExplanationEdge[], seen: Set<string>, edge: ListingPreviewExplanationEdge): void {
  if (edges.length >= MAX_EDGES) return;
  const k = `${edge.fromId}->${edge.toId}:${edge.reason}`;
  if (seen.has(k)) return;
  seen.add(k);
  edges.push(edge);
}

function summarizeMetrics(metrics: ListingObservationSnapshot | null): string {
  if (!metrics) return "Listing metrics snapshot unavailable.";
  const parts = [
    `views=${metrics.views}`,
    `bookings=${metrics.bookings}`,
    `conversionRate=${metrics.conversionRate.toFixed(4)}`,
    `listingStatus=${String(metrics.listingStatus)}`,
    metrics.price != null && metrics.price > 0 ? `priceCents=${metrics.price}` : "price missing",
  ];
  return parts.join("; ");
}

export function buildPreviewExplanation(params: {
  listingId: string;
  metrics: ListingObservationSnapshot | null;
  observation: ObservationSnapshot;
  signals: MarketplaceSignal[];
  opportunities: Opportunity[];
  proposedActions: ProposedAction[];
  policyDecisions: PolicyDecision[];
  /** Optional legal readiness lines (deterministic; no raw documents). */
  legalReadinessLines?: string[];
  legalRuleImpacts?: string[];
  /** Québec compliance preview lines (read-only; no document contents). */
  quebecComplianceLines?: string[];
  /** Certificate of location helper lines (read-only; deterministic heuristics). */
  certificateOfLocationLines?: string[];
  /** Syria region: machine tags from `syria-preview-explainability.service` (read-only). */
  syriaStructuredLines?: readonly string[];
  /** Syria region: operator-facing bullets — merged into findings when present. */
  syriaExplainabilityBullets?: readonly string[];
}): ListingPreviewExplanation {
  try {
    const nodes: ListingPreviewExplanationNode[] = [];
    const edges: ListingPreviewExplanationEdge[] = [];
    const seenN = new Set<string>();
    const seenE = new Set<string>();

    pushNode(nodes, seenN, {
      id: "node-metrics",
      kind: "metrics",
      label: "Listing observation metrics",
      detail: summarizeMetrics(params.metrics),
    });

    pushNode(nodes, seenN, {
      id: "node-observation",
      kind: "metrics",
      label: "Observation envelope",
      detail: `Built at ${params.observation.builtAt}; target=${params.observation.target.type}:${params.observation.target.id ?? ""}`,
    });
    pushEdge(edges, seenE, {
      fromId: "node-metrics",
      toId: "node-observation",
      reason: "Metrics hydrate the preview observation envelope.",
    });

    for (const s of params.signals) {
      pushNode(nodes, seenN, {
        id: `node-sig-${s.id}`,
        kind: "signal",
        label: `${s.signalType}`,
        detail: s.explanation,
      });
      pushEdge(edges, seenE, {
        fromId: "node-metrics",
        toId: `node-sig-${s.id}`,
        reason: "Signal derived from observed metrics / listing facts.",
      });
    }

    for (const o of params.opportunities) {
      pushNode(nodes, seenN, {
        id: `node-opp-${o.id}`,
        kind: "opportunity",
        label: o.title,
        detail: o.explanation,
      });
      for (const s of params.signals) {
        const ev = o.evidence as Record<string, unknown> | undefined;
        const ref = typeof ev?.signalRef === "string" ? ev.signalRef : null;
        if (ref && s.id === ref) {
          pushEdge(edges, seenE, {
            fromId: `node-sig-${s.id}`,
            toId: `node-opp-${o.id}`,
            reason: "Opportunity justified by metric signal evidence.",
          });
        }
      }
    }

    let pi = 0;
    for (const o of params.opportunities) {
      for (const _a of o.proposedActions) {
        const pol = params.policyDecisions[pi];
        pi += 1;
        if (!pol) continue;
        pushNode(nodes, seenN, {
          id: `node-pol-${pol.id}`,
          kind: "policy",
          label: `Policy ${pol.disposition}`,
          detail: pol.ruleResults.map((r) => r.ruleCode).join(", "),
        });
        pushEdge(edges, seenE, {
          fromId: `node-opp-${o.id}`,
          toId: `node-pol-${pol.id}`,
          reason: "Preview policy evaluation for proposed action.",
        });
      }
    }

    for (const a of params.proposedActions) {
      pushNode(nodes, seenN, {
        id: `node-act-${a.id}`,
        kind: "action",
        label: a.title,
        detail: typeof a.metadata?.previewReason === "string" ? a.metadata.previewReason : a.humanReadableSummary,
      });
      pushEdge(edges, seenE, {
        fromId: `node-opp-${a.opportunityId}`,
        toId: `node-act-${a.id}`,
        reason: "Preview-only proposed task — never executed automatically.",
      });
    }

    const qcLines = params.quebecComplianceLines ?? [];
    const syriaLines = params.syriaStructuredLines ?? [];
    const syriaBullets = params.syriaExplainabilityBullets ?? [];
    const legalLines = [...(params.legalReadinessLines ?? []), ...(params.legalRuleImpacts ?? [])];
    const keyFindings: ListingPreviewKeyFinding[] = [];
    for (let i = 0; i < Math.min(6, legalLines.length); i++) {
      const line = legalLines[i]!;
      keyFindings.push({
        id: `kf-legal-${i}`,
        label: "Legal readiness",
        detail: line,
      });
    }
    const colLines = params.certificateOfLocationLines ?? [];
    for (let i = 0; i < Math.min(4, colLines.length); i++) {
      const line = colLines[i]!;
      keyFindings.push({
        id: `kf-col-${i}`,
        label: "Certificate of location",
        detail: line,
      });
    }
    for (let i = 0; i < Math.min(4, syriaLines.length); i++) {
      const line = syriaLines[i]!;
      keyFindings.push({
        id: `kf-syria-struct-${i}`,
        label: "Syria preview policy",
        detail: line,
      });
    }
    for (let i = 0; i < Math.min(5, syriaBullets.length); i++) {
      const line = syriaBullets[i]!;
      keyFindings.push({
        id: `kf-syria-bullet-${i}`,
        label: "Syria boundary / policy",
        detail: line,
      });
    }
    for (let i = 0; i < Math.min(5, params.signals.length); i++) {
      const s = params.signals[i]!;
      keyFindings.push({
        id: `kf-${s.id}`,
        label: s.signalType,
        detail: s.explanation,
      });
    }

    const recommendations: ListingPreviewRecommendation[] = [];
    for (let i = 0; i < Math.min(5, params.proposedActions.length); i++) {
      const a = params.proposedActions[i]!;
      recommendations.push({
        id: `rec-${a.id}`,
        title: a.title,
        detail:
          typeof a.metadata?.previewReason === "string" ?
            a.metadata.previewReason
          : "Review this preview recommendation — execution remains disabled.",
      });
    }

    const summaryParts = [
      `[Preview read-only] Listing ${params.listingId}`,
      params.metrics ? "Metrics snapshot present." : "Metrics snapshot missing.",
      qcLines.length ? `${qcLines.length} Québec compliance preview line(s).` : "Québec compliance preview lines omitted.",
      colLines.length ? `${colLines.length} certificate-of-location helper line(s).` : "Certificate helper lines omitted.",
      syriaLines.length ? `Syria explainability tags: ${syriaLines.length} line(s).` : "",
      `${params.signals.length} preview signal(s)`,
      `${params.opportunities.length} opportunity cluster(s)`,
      `${params.proposedActions.length} proposed preview action(s)`,
    ].filter((x) => x.length > 0);

    return {
      summary: summaryParts.join(" · "),
      keyFindings,
      recommendations,
      graph: { nodes, edges },
    };
  } catch {
    return emptyListingPreviewExplanation(params.listingId);
  }
}
