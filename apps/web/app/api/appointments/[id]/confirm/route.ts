import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { createAppointmentEvent, afterAppointmentEvent } from "@/modules/scheduling/services/appointment-helpers";
import { notifyAppointmentConfirmed } from "@/modules/scheduling/services/appointment-notifications";
import { sendSystemMessageForAppointmentIfExists } from "@/modules/messaging/services/send-system-message";
import { canManageAppointment, type AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";
import { canTransitionAppointmentStatus } from "@/modules/scheduling/services/appointment-status-machine";
import { onAppointmentConfirmed } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
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
  if (!canManageAppointment(viewer, appt)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canTransitionAppointmentStatus(appt.status, "CONFIRMED", user.role)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  await createAppointmentEvent(id, "CONFIRMED", userId, "Confirmed");
  await afterAppointmentEvent(updated, "CONFIRMED", "Confirmed");
  notifyAppointmentConfirmed(updated);

  void trackDemoEvent(DemoEvents.APPOINTMENT_CONFIRMED, { appointmentId: id }, userId);

  const participants = [updated.brokerId, updated.clientUserId].filter(
    (x): x is string => typeof x === "string" && x.length > 0
  );
  void onAppointmentConfirmed({
    appointmentId: id,
    participantUserIds: [...new Set(participants)],
    title: updated.title ?? undefined,
  });

  try {
    await sendSystemMessageForAppointmentIfExists(
      id,
      `The appointment was confirmed for ${updated.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`,
      { actorId: userId }
    );
  } catch (e) {
    console.warn("[appointment-confirm] thread system message", e);
  }

  return NextResponse.json({ ok: true, appointment: updated });
}
