import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: {
    stage?: string;
    notes?: string | null;
    nextFollowUpAt?: Date | null;
    convertedBookingId?: string | null;
    assignedToUserId?: string | null;
  } = {};

  if (typeof body.stage === "string") data.stage = body.stage;
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" ? body.notes : null;
  if (body.nextFollowUpAt !== undefined) {
    if (body.nextFollowUpAt === null) data.nextFollowUpAt = null;
    else if (typeof body.nextFollowUpAt === "string") {
      const d = new Date(body.nextFollowUpAt);
      data.nextFollowUpAt = Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if (body.convertedBookingId !== undefined) {
    data.convertedBookingId =
      typeof body.convertedBookingId === "string" && body.convertedBookingId ? body.convertedBookingId : null;
  }
  if (body.assignedToUserId !== undefined) {
    data.assignedToUserId =
      typeof body.assignedToUserId === "string" && body.assignedToUserId ? body.assignedToUserId : null;
  }

  try {
    const entry = await prisma.bnhubSalesAssistEntry.update({
      where: { id },
      data,
      include: {
        guest: { select: { id: true, email: true, name: true } },
        convertedBooking: { select: { id: true, status: true } },
      },
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
