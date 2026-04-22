/**
 * Advisory-only review stubs — v1 produces draft payloads / audit logs only; never mutates live policy.
 */
import type { PolicyProposal } from "./policy-proposal.types";

export type DraftConfigPayload = {
  proposalId: string;
  status: "draft_stub";
  createdAt: string;
  note: string;
};

/** No-op approve — log-only contract for future workflow integration. */
export function approvePolicyProposal(proposal: PolicyProposal): { ok: true; logged: string } {
  const logged = `[policy-proposal-review] approve stub proposalId=${proposal.id} type=${proposal.type}`;
  return { ok: true, logged };
}

/** No-op reject — advisory audit trail hook. */
export function rejectPolicyProposal(proposal: PolicyProposal, reason?: string): { ok: true; logged: string } {
  const logged = `[policy-proposal-review] reject stub proposalId=${proposal.id} reason=${reason ?? "unspecified"}`;
  return { ok: true, logged };
}

/** Convert proposal to an inert draft JSON payload — safe to persist as documentation only. */
export function convertProposalToDraftConfig(proposal: PolicyProposal): DraftConfigPayload {
  return {
    proposalId: proposal.id,
    status: "draft_stub",
    createdAt: new Date().toISOString(),
    note:
      "Draft-only placeholder — does not alter production YAML, env, or governance stores. Policy owners must author real config.",
  };
}
