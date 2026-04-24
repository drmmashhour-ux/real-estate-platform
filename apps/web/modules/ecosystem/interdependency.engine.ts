/**
 * Maps how ecosystem layers reinforce each other and how data tends to flow.
 * For roadmap alignment — not a claim of exclusivity or switching costs.
 */

import {
  ECOSYSTEM_LAYERS,
  type EcosystemLayerId,
} from "./layers";

export type InterdependencyEdge = {
  from: EcosystemLayerId;
  to: EcosystemLayerId;
  /** How usage in `from` strengthens outcomes in `to` when value is delivered well. */
  reinforcement: string;
  /** Typical direction of derived signals (not a data contract). */
  dataFlow: string;
};

/**
 * Directed edges: read as "`from` feeds / strengthens `to`" for planning discussions.
 */
export const ECOSYSTEM_INTERDEPENDENCIES: InterdependencyEdge[] = [
  {
    from: "core",
    to: "intelligence",
    reinforcement:
      "Structured CRM, deal stages, and message history supply labeled context that makes scoring and suggestions more relevant.",
    dataFlow: "Activities, outcomes, and preferences flow into feature stores and model inputs (subject to privacy and consent).",
  },
  {
    from: "intelligence",
    to: "core",
    reinforcement:
      "Rankings and drafts reduce friction in the core workflow when users can accept, edit, or reject them freely.",
    dataFlow: "Scores and explanations surface back into CRM views, deal boards, and inboxes.",
  },
  {
    from: "marketplace",
    to: "core",
    reinforcement:
      "Inbound leads and listing engagement create actionable records in CRM and deals instead of orphaned spreadsheets.",
    dataFlow: "Lead metadata, listing IDs, and transaction milestones sync to core objects.",
  },
  {
    from: "core",
    to: "marketplace",
    reinforcement:
      "Clean pipeline and qualification data improves marketplace matching quality and reduces noise for counterparties.",
    dataFlow: "Eligibility, availability, and performance signals can inform marketplace exposure (user-controlled).",
  },
  {
    from: "infrastructure",
    to: "core",
    reinforcement:
      "APIs and integrations let teams connect existing stacks so the core layer reflects ground truth.",
    dataFlow: "External systems push/pull contacts, calendars, documents, and accounting hooks.",
  },
  {
    from: "infrastructure",
    to: "intelligence",
    reinforcement:
      "Standardized events and webhooks allow safer, auditable automation around scoring jobs.",
    dataFlow: "Operational events and ETL exports feed batch or near-real-time intelligence pipelines.",
  },
  {
    from: "partner",
    to: "marketplace",
    reinforcement:
      "Broker and agency participation broadens liquidity and trust signals when governance is transparent.",
    dataFlow: "Partner-sourced inventory and demand enter marketplace workflows with clear attribution.",
  },
  {
    from: "partner",
    to: "core",
    reinforcement:
      "Coordinated handoffs and shared workspaces reduce duplicate entry when partners opt in.",
    dataFlow: "Referrals, mandates, and service tasks link to CRM entities with permission boundaries.",
  },
  {
    from: "core",
    to: "infrastructure",
    reinforcement:
      "Stable core entities and events make integration investments predictable for customers.",
    dataFlow: "Canonical IDs and lifecycle hooks exposed for downstream builders.",
  },
];

export type LayerInterdependencySummary = {
  layer: EcosystemLayerId;
  title: string;
  outgoing: InterdependencyEdge[];
  incoming: InterdependencyEdge[];
};

/**
 * Group edges by layer for dashboards and docs.
 */
export function summarizeInterdependencies(): LayerInterdependencySummary[] {
  return Object.values(ECOSYSTEM_LAYERS).map((layer) => ({
    layer: layer.id,
    title: layer.title,
    outgoing: ECOSYSTEM_INTERDEPENDENCIES.filter((e) => e.from === layer.id),
    incoming: ECOSYSTEM_INTERDEPENDENCIES.filter((e) => e.to === layer.id),
  }));
}
