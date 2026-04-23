/** CRM listing visit scheduling — distinct from BNHub `Booking` (stays). */
export type LecipmVisitSourceTag = "CENTRIS" | "DIRECT" | "AI_CLOSER" | "MOBILE";

export type FormattedSlot = {
  startIso: string;
  endIso: string;
  dayLabel: string;
  timeLabel: string;
  relativeLabel: string;
};

export type BookVisitConfirmResult =
  | { ok: true; visitRequestId: string; visitId?: string }
  | { ok: false; error: string; code?: "conflict" | "validation" | "not_found" };

export type BestBrokerResult = {
  brokerId: string | null;
  reason: string;
  availabilityScore: number;
};
