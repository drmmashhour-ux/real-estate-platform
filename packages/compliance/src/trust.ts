export type TrustDecision =
  | { allowed: true; warning?: string }
  | { allowed: false; reason: string };

export function validateTrustDepositCreation(input: {
  depositType: string;
  contextType: string;
  amountCents: number;
  trustAccountEnabled: boolean;
  releaseRuleText?: string | null;
}): TrustDecision {
  if (!input.amountCents || input.amountCents <= 0) {
    return { allowed: false, reason: "INVALID_DEPOSIT_AMOUNT" };
  }

  if (!input.trustAccountEnabled) {
    return { allowed: false, reason: "TRUST_ACCOUNT_NOT_ENABLED" };
  }

  if (input.depositType === "security_deposit_vacation_resort" && input.contextType !== "lease_vacation_resort") {
    return { allowed: false, reason: "VACATION_RESORT_DEPOSIT_CONTEXT_REQUIRED" };
  }

  if (input.depositType === "security_deposit_vacation_resort" && !input.releaseRuleText?.trim()) {
    return { allowed: false, reason: "VACATION_RESORT_RELEASE_CONDITIONS_REQUIRED" };
  }

  return { allowed: true };
}

export function validateTrustRelease(input: {
  status: string;
  releaseRuleType?: string | null;
  disputed?: boolean;
  frozen?: boolean;
}): TrustDecision {
  if (input.disputed) {
    return { allowed: false, reason: "DEPOSIT_DISPUTED_RELEASE_BLOCKED" };
  }

  if (input.frozen) {
    return { allowed: false, reason: "DEPOSIT_FROZEN_RELEASE_BLOCKED" };
  }

  if (input.status !== "held_in_trust" && input.status !== "release_requested") {
    return { allowed: false, reason: "DEPOSIT_NOT_RELEASABLE" };
  }

  if (!input.releaseRuleType) {
    return { allowed: false, reason: "RELEASE_RULE_REQUIRED" };
  }

  return { allowed: true };
}
