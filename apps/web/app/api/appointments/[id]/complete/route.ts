import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createAppointmentEvent, afterAppointmentEvent } from "@/modules/scheduling/services/appointment-helpers";
import { notifyAppointmentCompleted } from "@/modules/scheduling/services/appointment-notifications";
import { canManageAppointment, type AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";
import { canTransitionAppointmentStatus } from "@/modules/scheduling/services/appointment-status-machine";

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
  if (!canTransitionAppointmentStatus(appt.status, "COMPLETED", user.role)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  await createAppointmentEvent(id, "COMPLETED", userId, "Completed");
  await afterAppointmentEvent(updated, "COMPLETED", "Completed");
  notifyAppointmentCompleted(updated);

  return NextResponse.json({ ok: true, appointment: updated });
}
