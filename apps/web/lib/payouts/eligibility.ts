export interface PayoutEligibilityResult {
  eligible: boolean;
  status: "eligible" | "manual" | "not_ready";
  reason: string | null;
}

export function evaluatePayoutEligibility(input: {
  bookingPaid: boolean;
  hostHasConnectedAccount: boolean;
  payoutsEnabled: boolean;
  bookingCompleted: boolean;
  manualMarket: boolean;
}): PayoutEligibilityResult {
  if (!input.bookingPaid) {
    return { eligible: false, status: "not_ready", reason: "booking_not_paid" };
  }

  if (input.manualMarket) {
    return { eligible: false, status: "manual", reason: "manual_market" };
  }

  if (!input.hostHasConnectedAccount || !input.payoutsEnabled) {
    return { eligible: false, status: "manual", reason: "connect_not_ready" };
  }

  if (!input.bookingCompleted) {
    return { eligible: false, status: "not_ready", reason: "stay_not_completed" };
  }

  return { eligible: true, status: "eligible", reason: null };
}
