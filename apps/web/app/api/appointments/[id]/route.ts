import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canViewAppointment } from "@/modules/scheduling/services/appointment-permissions";
import type { AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const viewer: AppointmentViewer = user;

  const { id } = await ctx.params;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      broker: { select: { id: true, name: true, email: true } },
      clientUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
      offer: { select: { id: true, status: true, listingId: true } },
      contract: { select: { id: true, title: true, status: true } },
      brokerClient: { select: { id: true, fullName: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewAppointment(viewer, appt)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, appointment: appt });
}
