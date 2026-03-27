import type { AppointmentStatus, PlatformRole } from "@prisma/client";

type Actor = "BROKER" | "ADMIN" | "CLIENT";

function actorFromRole(role: PlatformRole): Actor {
  if (role === "ADMIN") return "ADMIN";
  if (role === "BROKER") return "BROKER";
  return "CLIENT";
}

/** Centralized appointment workflow transitions. */
export function getAllowedAppointmentTransitions(
  current: AppointmentStatus,
  actorRole: PlatformRole
): AppointmentStatus[] {
  const a = actorFromRole(actorRole);
  switch (current) {
    case "PENDING":
      if (a === "ADMIN" || a === "BROKER") return ["CONFIRMED", "CANCELLED"];
      if (a === "CLIENT") return ["CANCELLED", "RESCHEDULE_REQUESTED"];
      return [];
    case "CONFIRMED":
      if (a === "ADMIN" || a === "BROKER") return ["CANCELLED", "COMPLETED", "NO_SHOW", "RESCHEDULE_REQUESTED"];
      if (a === "CLIENT") return ["CANCELLED", "RESCHEDULE_REQUESTED"];
      return [];
    case "RESCHEDULE_REQUESTED":
      if (a === "ADMIN" || a === "BROKER") return ["CONFIRMED", "CANCELLED"];
      if (a === "CLIENT") return ["CANCELLED"];
      return [];
    case "CANCELLED":
    case "COMPLETED":
    case "NO_SHOW":
      return [];
    default:
      return [];
  }
}

export function canTransitionAppointmentStatus(
  current: AppointmentStatus,
  next: AppointmentStatus,
  actorRole: PlatformRole
): boolean {
  if (current === next) return false;
  return getAllowedAppointmentTransitions(current, actorRole).includes(next);
}
