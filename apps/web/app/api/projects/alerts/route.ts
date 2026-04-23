import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getProjectsUserId } from "@/lib/projects-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getProjectsUserId();
    const list = await prisma.projectAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/projects/alerts:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const {
      city,
      maxPrice,
      minPrice,
      projectId,
      deliveryYear,
      alertType = "new-project",
    } = body;
    const alert = await prisma.projectAlert.create({
      data: {
        userId,
        city: city ?? null,
        maxPrice: maxPrice != null ? Number(maxPrice) : null,
        minPrice: minPrice != null ? Number(minPrice) : null,
        projectId: projectId ?? null,
        deliveryYear: deliveryYear != null ? Number(deliveryYear) : null,
        alertType: alertType || "new-project",
        isActive: true,
      },
    });
    return NextResponse.json(alert);
  } catch (e) {
    console.error("POST /api/projects/alerts:", e);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const body = await req.json().catch(() => ({}));
    const { id, isActive } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const alert = await prisma.projectAlert.updateMany({
      where: { id, userId },
      data: { ...(typeof isActive === "boolean" && { isActive }) },
    });
    if (alert.count === 0) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    const updated = await prisma.projectAlert.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/projects/alerts:", e);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getProjectsUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.projectAlert.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/projects/alerts:", e);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
