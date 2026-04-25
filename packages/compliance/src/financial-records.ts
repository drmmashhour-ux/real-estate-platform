export type FinancialDecision =
  | { allowed: true; warning?: string }
  | { allowed: false; reason: string };

export function classifyFundsDestination(input: { receivedForType: string; paymentMethod: string }) {
  if (input.receivedForType === "trust_deposit") return "trust";
  if (input.receivedForType === "brokerage_fee") return "operating";
  if (input.receivedForType === "platform_fee") return "platform_revenue";
  return "pending_review";
}

export function validateCashReceipt(input: {
  amountCents: number;
  paymentMethod: string;
  receivedForType: string;
  fundsDestinationType: string;
  payerName?: string | null;
}): FinancialDecision {
  if (!input.amountCents || input.amountCents <= 0) {
    return { allowed: false, reason: "INVALID_RECEIPT_AMOUNT" };
  }

  if (!input.paymentMethod?.trim()) {
    return { allowed: false, reason: "PAYMENT_METHOD_REQUIRED" };
  }

  if (!input.receivedForType?.trim()) {
    return { allowed: false, reason: "RECEIPT_PURPOSE_REQUIRED" };
  }

  if (!input.fundsDestinationType?.trim()) {
    return { allowed: false, reason: "FUNDS_DESTINATION_REQUIRED" };
  }

  if (!input.payerName?.trim()) {
    return { allowed: false, reason: "INCOMPLETE_RECEIPT_FORM" };
  }

  if (input.receivedForType === "trust_deposit" && input.fundsDestinationType !== "trust") {
    return { allowed: false, reason: "TRUST_FUNDS_MISCLASSIFIED" };
  }

  if (input.receivedForType === "brokerage_fee" && input.fundsDestinationType === "trust") {
    return { allowed: false, reason: "OPERATING_FEE_MISROUTED_TO_TRUST" };
  }

  if (input.receivedForType === "platform_fee" && input.fundsDestinationType === "trust") {
    return { allowed: false, reason: "PLATFORM_FEE_MISROUTED_TO_TRUST" };
  }

  return { allowed: true };
}

export function canModifyLedgerEntry(input: {
  locked: boolean;
  requestedAction: "edit" | "delete" | "reverse";
}): FinancialDecision {
  if (input.requestedAction === "delete") {
    return { allowed: false, reason: "LEDGER_DELETE_FORBIDDEN" };
  }

  if (input.locked && input.requestedAction === "edit") {
    return { allowed: false, reason: "LOCKED_LEDGER_ENTRY_EDIT_FORBIDDEN" };
  }

  return { allowed: true };
}
