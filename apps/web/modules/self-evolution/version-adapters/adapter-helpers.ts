import type { EvolutionProposalCategory } from "@prisma/client";

export type AdapterResult = {
  ok: boolean;
  error?: string;
  appliedVersionKey?: string;
  trace: string;
};

const TRACE = "version-adapter: ledger-only; real subsystem config is a separate, explicit activation step.";

/**
 * All mutations are no-ops in this module — the evolution DB rows are the system of record until a subsystem is wired to read them.
 */
export function recordAdapterLog(category: EvolutionProposalCategory, proposedKey: string): AdapterResult {
  return { ok: true, appliedVersionKey: proposedKey, trace: `${TRACE} cat=${category}` };
}

const SUPPORTED: EvolutionProposalCategory[] = [
  "ROUTING_WEIGHT",
  "RANKING_WEIGHT",
  "THRESHOLD",
  "FOLLOWUP_TIMING",
  "PLAYBOOK",
  "HANDOFF_RULE",
  "FEATURE_SUBSET",
  "OTHER",
];

export function isCategorySupportedInAdapterLayer(category: EvolutionProposalCategory): boolean {
  return SUPPORTED.includes(category);
}
