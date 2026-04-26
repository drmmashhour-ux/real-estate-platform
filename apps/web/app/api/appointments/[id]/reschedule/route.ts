import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { createAppointmentEvent, afterAppointmentEvent } from "@/modules/scheduling/services/appointment-helpers";
import { notifyAppointmentRescheduled } from "@/modules/scheduling/services/appointment-notifications";
import {
  canManageAppointment,
  canClientRequestReschedule,
  type AppointmentViewer,
} from "@/modules/scheduling/services/appointment-permissions";
import { canTransitionAppointmentStatus } from "@/modules/scheduling/services/appointment-status-machine";
import {
  appointmentOverlaps,
  isValidAppointmentRange,
  isWithinAvailability,
} from "@/modules/scheduling/services/scheduling-rules";
import { sendSystemMessageForAppointmentIfExists } from "@/modules/messaging/services/send-system-message";
import { onAppointmentRescheduledOrCancelled } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const viewer: AppointmentViewer = user;

  const { id } = await ctx.params;
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
  const endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "startsAt and endsAt required" }, { status: 400 });
  }
  if (!isValidAppointmentRange(startsAt, endsAt)) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) || null : null;

  const isBroker = canManageAppointment(viewer, appt);
  const isClient = canClientRequestReschedule(viewer, appt);

  if (!isBroker && !isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isBroker) {
    if (!["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"].includes(appt.status)) {
      return NextResponse.json({ error: "Cannot reschedule from this status" }, { status: 400 });
    }
    const [rules, exceptions, existing] = await Promise.all([
      prisma.availabilityRule.findMany({ where: { brokerId: appt.brokerId, isActive: true } }),
      prisma.availabilityException.findMany({
        where: {
          brokerId: appt.brokerId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      }),
      prisma.appointment.findMany({
        where: {
          brokerId: appt.brokerId,
          id: { not: appt.id },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"] },
        },
        select: { startsAt: true, endsAt: true, status: true },
      }),
    ]);
    if (
      !isWithinAvailability(
        rules.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startMinute: r.startMinute,
          endMinute: r.endMinute,
          isActive: r.isActive,
        })),
        exceptions.map((e) => ({
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          isAvailable: e.isAvailable,
        })),
        startsAt,
        endsAt,
        null
      )
    ) {
      return NextResponse.json({ error: "Outside availability" }, { status: 400 });
    }
    if (appointmentOverlaps(existing, startsAt, endsAt)) {
      return NextResponse.json({ error: "Overlaps another booking" }, { status: 409 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        startsAt,
        endsAt,
        status: "CONFIRMED",
        rescheduleReason: reason,
        confirmedAt: appt.confirmedAt ?? new Date(),
      },
    });
    await createAppointmentEvent(id, "RESCHEDULED", userId, reason ?? "Rescheduled by broker", {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
    await afterAppointmentEvent(updated, "RESCHEDULED", reason);
    notifyAppointmentRescheduled(updated);
    void trackDemoEvent(DemoEvents.APPOINTMENT_RESCHEDULED, { appointmentId: id }, userId);
    {
      const participants = [appt.brokerId, appt.clientUserId].filter(Boolean) as string[];
      const others = [...new Set(participants)].filter((uid) => uid !== userId);
      void onAppointmentRescheduledOrCancelled({
        appointmentId: id,
        participantUserIds: others,
        kind: "rescheduled",
      });
    }
    return NextResponse.json({ ok: true, appointment: updated });
  }

  if (!canTransitionAppointmentStatus(appt.status, "RESCHEDULE_REQUESTED", user.role)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      startsAt,
      endsAt,
      status: "RESCHEDULE_REQUESTED",
      rescheduleReason: reason,
    },
  });
  await createAppointmentEvent(id, "RESCHEDULED", userId, reason ?? "Reschedule requested", {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });
  await afterAppointmentEvent(updated, "RESCHEDULED", reason);
  notifyAppointmentRescheduled(updated);
  void trackDemoEvent(DemoEvents.APPOINTMENT_RESCHEDULED, { appointmentId: id }, userId);
  {
    const participants = [appt.brokerId, appt.clientUserId].filter(Boolean) as string[];
    const others = [...new Set(participants)].filter((uid) => uid !== userId);
    void onAppointmentRescheduledOrCancelled({
      appointmentId: id,
      participantUserIds: others,
      kind: "rescheduled",
    });
  }

  try {
    await sendSystemMessageForAppointmentIfExists(
      id,
      `A reschedule was requested for ${startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} – ${endsAt.toLocaleString(undefined, { timeStyle: "short" })}.`,
      { actorId: userId }
    );
  } catch (e) {
    console.warn("[appointment-reschedule] thread system message", e);
  }

  return NextResponse.json({ ok: true, appointment: updated });
}
