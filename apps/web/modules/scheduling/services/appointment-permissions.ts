import type { Appointment, PlatformRole } from "@prisma/client";

export type AppointmentViewer = { id: string; role: PlatformRole };

/** Client sees own appointments; broker sees own calendar; admin sees all. */
export function canViewAppointment(user: AppointmentViewer, appt: Pick<Appointment, "brokerId" | "clientUserId">): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "BROKER" && appt.brokerId === user.id) return true;
  if (appt.clientUserId && appt.clientUserId === user.id) return true;
  return false;
}

/** Broker/admin manage broker calendar; client limited to cancel/reschedule own pending/confirmed. */
export function canManageAppointment(user: AppointmentViewer, appt: Pick<Appointment, "brokerId" | "clientUserId" | "status">): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "BROKER" && appt.brokerId === user.id) return true;
  return false;
}

export function canBookForBroker(user: { id: string | null }, brokerId: string): boolean {
  return !!user.id && !!brokerId;
}

export function canCancelAppointment(
  user: AppointmentViewer,
  appt: Pick<Appointment, "brokerId" | "clientUserId" | "status">
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "BROKER" && appt.brokerId === user.id) return true;
  if (appt.clientUserId === user.id && ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"].includes(appt.status)) {
    return true;
  }
  return false;
}

export function canClientRequestReschedule(
  user: AppointmentViewer,
  appt: Pick<Appointment, "clientUserId" | "status">
): boolean {
  if (!appt.clientUserId || appt.clientUserId !== user.id) return false;
  return appt.status === "PENDING" || appt.status === "CONFIRMED";
}
