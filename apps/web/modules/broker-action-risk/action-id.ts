/** Stable id for POST /api/actions/[id]/risk — URL-encode when placing in path. */
export function offerDraftApproveActionId(dealId: string, draftId: string) {
  return `offer_draft_approve:${dealId}:${draftId}`;
}

export function signatureSessionActionId(dealId: string) {
  return `signature_session:${dealId}`;
}

export type ParsedBrokerActionId =
  | { kind: "offer_draft_approve"; dealId: string; draftId: string }
  | { kind: "signature_session"; dealId: string };

export function parseBrokerActionId(actionId: string): ParsedBrokerActionId | null {
  const parts = actionId.split(":");
  if (parts.length === 3 && parts[0] === "offer_draft_approve") {
    const [, dealId, draftId] = parts;
    if (dealId && draftId) return { kind: "offer_draft_approve", dealId, draftId };
  }
  if (parts.length === 2 && parts[0] === "signature_session") {
    const dealId = parts[1];
    if (dealId) return { kind: "signature_session", dealId };
  }
  return null;
}
