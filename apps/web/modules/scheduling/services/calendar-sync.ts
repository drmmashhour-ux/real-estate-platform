import type { Appointment } from "@prisma/client";

/** Boundary for Google Calendar / Outlook later — platform remains source of truth. */
export async function createExternalCalendarEvent(_appt: Appointment): Promise<{ externalId?: string }> {
  void _appt;
  return {};
}

export async function updateExternalCalendarEvent(_appt: Appointment): Promise<void> {
  void _appt;
}

export async function cancelExternalCalendarEvent(_appt: Appointment): Promise<void> {
  void _appt;
}
