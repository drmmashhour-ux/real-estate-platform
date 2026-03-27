import { addMinutes } from "date-fns";
import type { AppointmentStatus } from "@prisma/client";
import { appointmentOverlaps, isWithinAvailability, type AvailabilityExceptionInput, type AvailabilityRuleInput } from "@/modules/scheduling/services/scheduling-rules";

export type SlotInput = {
  rules: AvailabilityRuleInput[];
  exceptions: AvailabilityExceptionInput[];
  existingAppointments: { startsAt: Date; endsAt: Date; status: AppointmentStatus }[];
  rangeStart: Date;
  rangeEnd: Date;
  slotDurationMinutes: number;
};

export type GeneratedSlot = { start: Date; end: Date };

/**
 * Walks forward from rangeStart in steps of slotDurationMinutes until rangeEnd.
 */
export function generateAvailableSlots(input: SlotInput): GeneratedSlot[] {
  const { rules, exceptions, existingAppointments, rangeStart, rangeEnd, slotDurationMinutes } = input;
  if (slotDurationMinutes <= 0 || rangeEnd <= rangeStart) return [];

  const out: GeneratedSlot[] = [];
  let t = new Date(rangeStart.getTime());
  while (addMinutes(t, slotDurationMinutes) <= rangeEnd) {
    const slotEnd = addMinutes(t, slotDurationMinutes);
    if (
      isWithinAvailability(rules, exceptions, t, slotEnd, null) &&
      !appointmentOverlaps(existingAppointments, t, slotEnd)
    ) {
      out.push({ start: new Date(t), end: new Date(slotEnd) });
    }
    t = addMinutes(t, slotDurationMinutes);
  }
  return out;
}
