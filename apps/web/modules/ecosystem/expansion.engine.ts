/**
 * Expansion guidance — when adding modules or ecosystem breadth is *likely* justified.
 * Favors organic pull from usage signals, support health, and strategic fit — not land-grabs.
 */

import { ECOSYSTEM_LAYER_IDS, type EcosystemLayerId } from "./layers";

export type ExpansionSignals = {
  /** 0–100 from network-effect engine or proxy. */
  networkActivityIndex: number;
  /** 0–100 from value-loop health. */
  loopStrength: number;
  /** 0–100 adoption depth (voluntary). */
  adoptionDepthScore: number;
  /** Tickets per 1k MAU — lower is healthier. */
  supportTicketsPer1kMau: number;
  /** 0–1 gross revenue retention or similar sustainability proxy. */
  revenueStabilityIndex: number;
  /** Layers already live in production (subset of ecosystem layers). */
  liveLayers: EcosystemLayerId[];
};

export type ExpansionDecision = {
  /** Whether the composite crosses a conservative threshold. */
  expandBreadthRecommended: boolean;
  /** Suggested next layer candidates — user must validate fit. */
  candidateLayers: EcosystemLayerId[];
  reasoning: string[];
  cautions: string[];
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Recommend *whether* to expand ecosystem breadth and *which* layers are missing.
 */
export function evaluateExpansion(signals: ExpansionSignals): ExpansionDecision {
  const live = new Set(signals.liveLayers);
  const missing = ECOSYSTEM_LAYER_IDS.filter((id) => !live.has(id));

  const n = clamp01(signals.networkActivityIndex / 100);
  const l = clamp01(signals.loopStrength / 100);
  const d = clamp01(signals.adoptionDepthScore / 100);
  const tickets = clamp01(1 - Math.min(80, Math.max(0, signals.supportTicketsPer1kMau)) / 80);
  const rev = clamp01(signals.revenueStabilityIndex);

  const composite = 0.25 * n + 0.25 * l + 0.2 * d + 0.15 * tickets + 0.15 * rev;
  const expandBreadthRecommended = composite >= 0.62 && missing.length > 0;

  const reasoning: string[] = [
    `Composite readiness: ${(composite * 100).toFixed(1)}% (weighted blend of activity, loop health, voluntary depth, support load, revenue stability).`,
  ];

  if (signals.supportTicketsPer1kMau > 55) {
    reasoning.push("Support load is elevated — stabilize core journeys before shipping new modules.");
  }
  if (signals.loopStrength < 45) {
    reasoning.push("Value loop still maturing — improve assistive quality and measurement before horizontal expansion.");
  }
  if (signals.adoptionDepthScore < 40) {
    reasoning.push("Adoption depth is modest — prove cross-module value in existing layers first.");
  }

  const cautions: string[] = [
    "Expansion must be justified by user pull and sustainable economics — not by excluding competitors or locking data.",
    "Each new module needs ownership, SLOs, and partner governance before launch.",
  ];

  const candidateLayers = expandBreadthRecommended ? missing : [];

  if (!expandBreadthRecommended && missing.length > 0) {
    reasoning.push("Hold breadth: strengthen fundamentals until composite readiness improves.");
  } else if (candidateLayers.length > 0) {
    reasoning.push(
      `Candidate next layers (missing today): ${candidateLayers.join(", ")} — validate with roadmap and capacity.`
    );
  } else {
    reasoning.push("All defined layers are marked live; consider deepening features inside existing layers instead.");
  }

  return { expandBreadthRecommended, candidateLayers, reasoning, cautions };
}
