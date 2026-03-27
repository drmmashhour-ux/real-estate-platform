/**
 * ImmoContact policy — metadata conventions for platform-wide audit trails (English).
 */

export type ImmoContactSourceHub =
  | "buyer"
  | "seller"
  | "broker"
  | "bnhub_guest"
  | "bnhub_host"
  | "landlord"
  | "tenant"
  | "mortgage"
  | "admin"
  | "system";

export type ImmoContactChannel =
  | "view"
  | "contact_click"
  | "message"
  | "call"
  | "booking_request"
  | "deal"
  | "form"
  | "chat"
  | "api";

/** Semantic sub-types stored in metadata when the DB enum is coarse. */
export type ImmoContactSemantic =
  | "first_listing_view"
  | "contact_button_click"
  | "first_message"
  | "formal_lead"
  | "booking_created"
  | "offer_linked"
  | "deal_linked"
  | "deal_started"
  | "dispute_linked";

export type StandardImmoMetadata = {
  sourceHub: ImmoContactSourceHub;
  channel: ImmoContactChannel;
  /** Optional finer-grained meaning */
  semantic?: ImmoContactSemantic;
  leadId?: string;
  bookingId?: string;
  dealId?: string;
  disputeId?: string;
  contractId?: string;
  platformPaymentId?: string;
  targetUserId?: string;
  /** Free-form client path or feature key */
  feature?: string;
};

/**
 * Merge policy fields into log metadata. Callers should spread after their own keys.
 */
export function buildImmoContactMetadata(
  partial: Record<string, unknown> | undefined,
  standard: StandardImmoMetadata
): Record<string, unknown> {
  return {
    ...(partial ?? {}),
    sourceHub: standard.sourceHub,
    channel: standard.channel,
    ...(standard.semantic ? { semantic: standard.semantic } : {}),
    ...(standard.leadId ? { leadId: standard.leadId } : {}),
    ...(standard.bookingId ? { bookingId: standard.bookingId } : {}),
    ...(standard.dealId ? { dealId: standard.dealId } : {}),
    ...(standard.disputeId ? { disputeId: standard.disputeId } : {}),
    ...(standard.contractId ? { contractId: standard.contractId } : {}),
    ...(standard.platformPaymentId ? { platformPaymentId: standard.platformPaymentId } : {}),
    ...(standard.targetUserId ? { targetUserId: standard.targetUserId } : {}),
    ...(standard.feature ? { feature: standard.feature } : {}),
  };
}
