/**
 * Draft follow-up for negotiation — no counters, no notices.
 */
export function buildNegotiationFollowUpDraft(input: { roundHint: number }): { body: string; requiresBrokerApproval: true } {
  return {
    body: `Follow-up draft: acknowledge latest exchange and propose next meeting/call (negotiation context — round hint ${input.roundHint}). Broker to edit.`,
    requiresBrokerApproval: true,
  };
}
