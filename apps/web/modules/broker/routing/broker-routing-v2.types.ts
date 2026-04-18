/**
 * Smart Lead Routing V2 — semi-automatic, policy-gated; never silent mass assignment.
 */

export type LeadRoutingDecision = {
  leadId: string;
  recommendedBrokerId: string;
  /** Convenience for UI — from V1 candidate row. */
  recommendedBrokerName?: string;
  confidenceScore: number;
  /** When true, auto-assign is blocked until an admin approves (or manual assign via panel). */
  requiresApproval: boolean;
  rationale: string[];
};
