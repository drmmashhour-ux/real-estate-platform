import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { generateAvailableSlots } from "@/modules/scheduling/services/generate-available-slots";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Public: available slots for a broker on a given day (UTC). */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { id: brokerId } = await ctx.params;
  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { id: true, role: true },
  });
  if (!broker || broker.role !== "BROKER") {
    return NextResponse.json({ error: "Broker not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date")?.trim() ?? "";
  const duration = Math.max(15, Math.min(240, parseInt(searchParams.get("duration") ?? "30", 10) || 30));
  const listingId = searchParams.get("listingId")?.trim() || undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!listing || listing.ownerId !== brokerId) {
      return NextResponse.json({ error: "Listing not available for this broker" }, { status: 400 });
    }
  }

  const rangeStart = new Date(`${dateStr}T00:00:00.000Z`);
  const rangeEnd = addDays(rangeStart, 1);

  const [rules, exceptions, appointments] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { brokerId, isActive: true } }),
    prisma.availabilityException.findMany({
      where: {
        brokerId,
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
    }),
    prisma.appointment.findMany({
      where: {
        brokerId,
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
        status: { in: ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"] },
      },
      select: { startsAt: true, endsAt: true, status: true },
    }),
  ]);

  const slots = generateAvailableSlots({
    rules: rules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startMinute: r.startMinute,
      endMinute: r.endMinute,
      isActive: r.isActive,
    })),
    exceptions: exceptions.map((e) => ({
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      isAvailable: e.isAvailable,
    })),
    existingAppointments: appointments,
    rangeStart,
    rangeEnd,
    slotDurationMinutes: duration,
  });

  return NextResponse.json({
    ok: true,
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  });
}
