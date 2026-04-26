import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getDemoProjectById } from "@/lib/data/demo-projects";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let project = await prisma.project.findUnique({
      where: { id },
      include: { units: true },
    });
    if (!project) {
      const demo = getDemoProjectById(id);
      if (demo) return NextResponse.json(demo);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (e) {
    console.error("GET /api/projects/[id]:", e);
    const { id } = await params;
    const demo = getDemoProjectById(id);
    if (demo) return NextResponse.json(demo);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    if (body.name != null) update.name = body.name;
    if (body.description != null) update.description = body.description;
    if (body.city != null) update.city = body.city;
    if (body.address != null) update.address = body.address;
    if (body.developer != null) update.developer = body.developer;
    if (body.deliveryDate != null) update.deliveryDate = new Date(body.deliveryDate);
    if (body.startingPrice != null) update.startingPrice = body.startingPrice;
    if (body.status != null) update.status = body.status;
    if (body.featured != null) update.featured = body.featured;
    if (body.featuredUntil != null) update.featuredUntil = body.featuredUntil ? new Date(body.featuredUntil) : null;
    if (body.latitude != null) update.latitude = body.latitude === "" ? null : Number(body.latitude);
    if (body.longitude != null) update.longitude = body.longitude === "" ? null : Number(body.longitude);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(update.name != null && { name: update.name as string }),
        ...(update.description != null && { description: update.description as string }),
        ...(update.city != null && { city: update.city as string }),
        ...(update.address != null && { address: update.address as string }),
        ...(update.developer != null && { developer: update.developer as string }),
        ...(update.deliveryDate != null && { deliveryDate: update.deliveryDate as Date }),
        ...(update.startingPrice != null && { startingPrice: update.startingPrice as number }),
        ...(update.status != null && { status: update.status as string }),
        ...(update.featured != null && { featured: update.featured as boolean }),
        ...(update.featuredUntil !== undefined && { featuredUntil: update.featuredUntil as Date | null }),
        ...(update.latitude !== undefined && { latitude: update.latitude as number | null }),
        ...(update.longitude !== undefined && { longitude: update.longitude as number | null }),
      },
      include: { units: true },
    });
    return NextResponse.json(project);
  } catch (e) {
    console.error("PATCH /api/projects/[id]:", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/projects/[id]:", e);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
