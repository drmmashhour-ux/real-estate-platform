import type { Appointment } from "@prisma/client";

/** Stubs — wire email/SMS later; staging-safe no-ops. */
export function notifyAppointmentRequested(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] requested", _appt.id);
  }
}

export function notifyAppointmentConfirmed(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] confirmed", _appt.id);
  }
}

export function notifyAppointmentRescheduled(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] rescheduled", _appt.id);
  }
}

export function notifyAppointmentCancelled(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] cancelled", _appt.id);
  }
}

export function notifyAppointmentReminder(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] reminder", _appt.id);
  }
}

export function notifyAppointmentCompleted(_appt: Appointment): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[appointment-notifications] completed", _appt.id);
  }
}
