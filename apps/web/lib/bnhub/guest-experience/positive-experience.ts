import type { Booking, BookingIssue, BnhubCheckinDetails } from "@prisma/client";

export type PositiveExperienceInput = {
  booking: Pick<Booking, "checkedInAt" | "checkedOutAt" | "checklistDeclaredByHostAt" | "status">;
  issues: Pick<BookingIssue, "status">[];
  checkinDetails: Pick<BnhubCheckinDetails, "instructions" | "keyInfo"> | null;
};

/**
 * Heuristic “smooth stay” signal — used for timing priority only (no review manipulation).
 */
export function computePositiveExperienceSignals(input: PositiveExperienceInput): {
  positiveExperience: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const openIssues = input.issues.filter((i) => i.status !== "resolved");
  if (openIssues.length > 0) {
    return { positiveExperience: false, reasons: ["open_booking_issues"] };
  }
  if (input.booking.status === "DISPUTED") {
    return { positiveExperience: false, reasons: ["booking_disputed"] };
  }
  if (input.booking.checkedInAt) reasons.push("checked_in_recorded");
  if (input.booking.checkedOutAt || input.booking.status === "COMPLETED") reasons.push("checkout_complete");
  if (input.booking.checklistDeclaredByHostAt) reasons.push("host_checklist_confirmed");
  const hasDetails =
    Boolean(input.checkinDetails?.instructions?.trim()) || Boolean(input.checkinDetails?.keyInfo?.trim());
  if (hasDetails) reasons.push("checkin_details_present");

  const positiveExperience = reasons.length >= 2;
  return { positiveExperience, reasons };
}
