export interface PricingBacktestInput {
  basePrice: number;
  suggestedPrice: number;
  actualBookings: number;
  baselineBookings: number;
}

export function evaluatePricingBacktest(input: PricingBacktestInput) {
  const bookingDelta = input.actualBookings - input.baselineBookings;
  const revenueDelta =
    input.suggestedPrice * input.actualBookings - input.basePrice * input.baselineBookings;

  return {
    bookingDelta,
    revenueDelta,
    outcome:
      revenueDelta > 0 ? ("POSITIVE" as const) : revenueDelta < 0 ? ("NEGATIVE" as const) : ("NEUTRAL" as const),
  };
}
