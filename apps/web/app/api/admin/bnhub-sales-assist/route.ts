import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await prisma.bnhubSalesAssistEntry.findMany({
    orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      guest: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
      convertedBooking: { select: { id: true, status: true, confirmationCode: true } },
    },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const guestEmail =
    typeof body.guestEmail === "string" && body.guestEmail.trim() ? body.guestEmail.trim().toLowerCase() : null;
  const guestUserId = typeof body.guestUserId === "string" ? body.guestUserId : null;
  const assignedToUserId = typeof body.assignedToUserId === "string" ? body.assignedToUserId : null;
  const stage = typeof body.stage === "string" && body.stage.trim() ? body.stage.trim() : "contacted";
  const notes = typeof body.notes === "string" ? body.notes : null;
  const nextFollowUpAt =
    typeof body.nextFollowUpAt === "string" && body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;

  if (!guestEmail && !guestUserId) {
    return NextResponse.json({ error: "guestEmail or guestUserId required" }, { status: 400 });
  }

  const entry = await prisma.bnhubSalesAssistEntry.create({
    data: {
      guestEmail: guestEmail ?? undefined,
      guestUserId: guestUserId ?? undefined,
      assignedToUserId: assignedToUserId ?? undefined,
      stage,
      notes: notes ?? undefined,
      nextFollowUpAt: nextFollowUpAt && !Number.isNaN(nextFollowUpAt.getTime()) ? nextFollowUpAt : undefined,
    },
    include: {
      guest: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ entry });
}
