import type { ManualPaymentSettlement } from "@prisma/client";

/** Manual settlement row is relevant when ops enabled manual tracking on the market. */
export function manualPaymentTrackingRelevant(args: { manualPaymentTrackingEnabled: boolean }): boolean {
  return args.manualPaymentTrackingEnabled;
}

export function isManualSettlementPending(s: ManualPaymentSettlement): boolean {
  return s === "PENDING";
}
