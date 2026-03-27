import type { AppointmentStatus, PlatformRole } from "@prisma/client";
import type { AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";
import { canManageAppointment } from "@/modules/scheduling/services/appointment-permissions";

export function getAppointmentDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function isValidAppointmentRange(start: Date, end: Date): boolean {
  if (!(end.getTime() > start.getTime())) return false;
  const mins = getAppointmentDurationMinutes(start, end);
  return mins > 0 && mins <= 24 * 60;
}

const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"];

export function appointmentOverlaps(
  existing: { startsAt: Date; endsAt: Date; status: AppointmentStatus }[],
  start: Date,
  end: Date
): boolean {
  for (const e of existing) {
    if (!BLOCKING_STATUSES.includes(e.status)) continue;
    if (start < e.endsAt && end > e.startsAt) return true;
  }
  return false;
}

export type AvailabilityRuleInput = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  isActive: boolean;
};

export type AvailabilityExceptionInput = {
  startsAt: Date;
  endsAt: Date;
  isAvailable: boolean;
};

function minutesOfDayUTC(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Weekly rules use UTC day-of-week and minutes (v1). Exceptions: isAvailable=false blocks; isAvailable=true adds a window.
 */
export function isWithinAvailability(
  rules: AvailabilityRuleInput[],
  exceptions: AvailabilityExceptionInput[],
  start: Date,
  end: Date,
  timezone?: string | null
): boolean {
  void timezone;
  for (const ex of exceptions) {
    if (!ex.isAvailable && start < ex.endsAt && end > ex.startsAt) return false;
  }

  const dow = start.getUTCDay();
  const sm = minutesOfDayUTC(start);
  const em = minutesOfDayUTC(end);
  const dayRules = rules.filter((r) => r.isActive && r.dayOfWeek === dow);
  let covered = false;
  for (const r of dayRules) {
    if (r.endMinute > r.startMinute && sm >= r.startMinute && em <= r.endMinute) {
      covered = true;
      break;
    }
  }
  if (covered) return true;

  for (const ex of exceptions) {
    if (ex.isAvailable && start >= ex.startsAt && end <= ex.endsAt) return true;
  }
  return false;
}

export function canUserManageAppointment(
  user: AppointmentViewer,
  appt: { brokerId: string; clientUserId: string | null }
): boolean {
  return canManageAppointment(user, { ...appt, status: "CONFIRMED" });
}

export function canUserBookAppointment(user: { id: string | null }, brokerId: string): boolean {
  return !!user.id && !!brokerId;
}
