export function buildSimpleClientUpdateDraft(input: { dealCode: string | null; status: string }): {
  shortMessage: string;
  requiresBrokerApproval: true;
} {
  return {
    shortMessage: `Update: your transaction (${input.dealCode ?? "ref on file"}) is at stage “${input.status}”. Your broker will advise next steps.`,
    requiresBrokerApproval: true,
  };
}
