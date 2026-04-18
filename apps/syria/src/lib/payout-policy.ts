import { syriaFlags } from "./platform-flags";

export type PayoutEligibilityReason =
  | "auto_payout_not_implemented"
  | "awaiting_check_in_or_window"
  | "eligible_for_manual_review";

/**
 * Controlled payout — never triggers payment rails. Guides admin on when review is typical:
 * after check-in and optionally after 24h. `AUTO_PAYOUT_ENABLED` stays off by default.
 */
export function describePayoutEligibility(input: {
  checkedInAt: Date | null;
  now?: Date;
}): { canReview: boolean; reason: PayoutEligibilityReason; notes: string } {
  if (syriaFlags.AUTO_PAYOUT_ENABLED) {
    return {
      canReview: false,
      reason: "auto_payout_not_implemented",
      notes:
        "AUTO_PAYOUT_ENABLED is set but automated disbursement is not wired — admin manual payout only.",
    };
  }

  const now = input.now ?? new Date();
  if (input.checkedInAt) {
    const hoursAfterCheckIn = (now.getTime() - input.checkedInAt.getTime()) / 3600000;
    if (hoursAfterCheckIn >= 24) {
      return {
        canReview: true,
        reason: "eligible_for_manual_review",
        notes: "≥24h after recorded check-in — typical window for admin payout approval.",
      };
    }
    return {
      canReview: true,
      reason: "eligible_for_manual_review",
      notes: "Checked in — admin may verify guest payment then approve payout (no auto-transfer).",
    };
  }

  return {
    canReview: false,
    reason: "awaiting_check_in_or_window",
    notes: "Awaiting check-in timestamp before payout review.",
  };
}
