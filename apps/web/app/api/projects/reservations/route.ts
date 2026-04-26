import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getProjectsUserId } from "@/lib/projects-user";
import {
  sendReservationNotificationToBroker,
  sendClientConfirmationEmail,
} from "@/lib/email/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const where = projectId ? { projectId, userId } : { userId };
    const list = await prisma.projectReservation.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, type: true, price: true, size: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/projects/reservations:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const { projectId, projectUnitId, fullName, email, phone, note } = body;
    if (!projectId || !projectUnitId || !fullName || !email || !phone) {
      return NextResponse.json(
        { error: "projectId, projectUnitId, fullName, email, phone required" },
        { status: 400 }
      );
    }
    const unit = await prisma.projectUnit.findFirst({
      where: { id: projectUnitId, projectId },
    });
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    if (unit.status !== "available") {
      return NextResponse.json(
        { error: "Unit is not available for reservation" },
        { status: 400 }
      );
    }
    const reservation = await prisma.projectReservation.create({
      data: {
        userId,
        projectId,
        projectUnitId,
        fullName: String(fullName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        note: note != null ? String(note).trim() : null,
        status: "pending",
      },
      include: {
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, type: true, price: true } },
      },
    });

    await sendReservationNotificationToBroker({
      projectName: reservation.project.name,
      unitType: reservation.unit?.type ?? "Unit",
      name: reservation.fullName,
      email: reservation.email,
      phone: reservation.phone,
    });
    await sendClientConfirmationEmail(reservation.email, reservation.fullName);

    return NextResponse.json(reservation);
  } catch (e) {
    console.error("POST /api/projects/reservations:", e);
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    const valid = ["pending", "reserved", "cancelled", "completed"];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const reservation = await prisma.projectReservation.update({
      where: { id },
      data: { status },
      include: {
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, type: true } },
      },
    });
    if (status === "reserved") {
      await prisma.projectUnit.update({
        where: { id: reservation.projectUnitId },
        data: { status: "reserved" },
      });
    }
    return NextResponse.json(reservation);
  } catch (e) {
    console.error("PATCH /api/projects/reservations:", e);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}
