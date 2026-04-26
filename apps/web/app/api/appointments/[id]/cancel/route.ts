import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { createAppointmentEvent, afterAppointmentEvent } from "@/modules/scheduling/services/appointment-helpers";
import { notifyAppointmentCancelled } from "@/modules/scheduling/services/appointment-notifications";
import { onAppointmentRescheduledOrCancelled } from "@/modules/notifications/services/workflow-notification-triggers";
import { canCancelAppointment, type AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";
import { canTransitionAppointmentStatus } from "@/modules/scheduling/services/appointment-status-machine";

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
  if (!canCancelAppointment(viewer, appt)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canTransitionAppointmentStatus(appt.status, "CANCELLED", user.role)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) || null : null;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  await createAppointmentEvent(id, "CANCELLED", userId, reason ?? "Cancelled", { reason });
  await afterAppointmentEvent(updated, "CANCELLED", reason);
  notifyAppointmentCancelled(updated);

  void trackDemoEvent(DemoEvents.APPOINTMENT_CANCELLED, { appointmentId: id }, userId);

  {
    const participants = [appt.brokerId, appt.clientUserId].filter(Boolean) as string[];
    const others = [...new Set(participants)].filter((uid) => uid !== userId);
    void onAppointmentRescheduledOrCancelled({
      appointmentId: id,
      participantUserIds: others,
      kind: "cancelled",
    });
  }

  return NextResponse.json({ ok: true, appointment: updated });
}
