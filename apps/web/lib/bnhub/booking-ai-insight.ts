/** Exact one-line copy for {@link getBookingAIDecisionMessage} — neutral tone, no hype. */
export const BOOKING_AI_DECISION_MESSAGES = {
  highDemand: "High demand for your dates",
  typical: "Price is typical for this area",
  increaseSoon: "Prices may increase soon",
} as const;

export type BookingAIDecisionMessage =
  (typeof BOOKING_AI_DECISION_MESSAGES)[keyof typeof BOOKING_AI_DECISION_MESSAGES];

/**
 * Returns exactly one short line to help guests decide at checkout (MVP heuristics, no live ML).
 * Priority: near-term or weekend short stay → demand; far check-in → price may rise; else typical.
 */
export function getBookingAIDecisionMessage(input: {
  bookingStatus: string;
  checkIn: Date;
  nights: number;
}): BookingAIDecisionMessage {
  const { bookingStatus: status, checkIn, nights } = input;

  if (status === "CANCELLED" || status === "DECLINED") {
    return BOOKING_AI_DECISION_MESSAGES.typical;
  }

  const daysUntilCheckIn = (checkIn.getTime() - Date.now()) / 86_400_000;
  const startDow = checkIn.getDay();

  if (daysUntilCheckIn > 0 && daysUntilCheckIn <= 21) {
    return BOOKING_AI_DECISION_MESSAGES.highDemand;
  }

  if (nights <= 4 && (startDow === 4 || startDow === 5 || startDow === 6)) {
    return BOOKING_AI_DECISION_MESSAGES.highDemand;
  }

  if (daysUntilCheckIn > 60) {
    return BOOKING_AI_DECISION_MESSAGES.increaseSoon;
  }

  return BOOKING_AI_DECISION_MESSAGES.typical;
}
