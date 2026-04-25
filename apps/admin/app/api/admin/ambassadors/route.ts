import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const ambassadors = await prisma.ambassador.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(
      ambassadors.map((a) => ({
        id: a.id,
        userId: a.userId,
        email: a.user.email,
        commission: a.commission,
        isActive: a.isActive,
      }))
    );
  } catch (e) {
    console.error("GET /api/admin/ambassadors:", e);
    return NextResponse.json({ error: "Failed to load ambassadors" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const ambassadorId = typeof body?.ambassadorId === "string" ? body.ambassadorId : null;
    if (!ambassadorId) return NextResponse.json({ error: "ambassadorId required" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body?.commission === "number") data.commission = body.commission;
    const updated = await prisma.ambassador.update({ where: { id: ambassadorId }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/ambassadors:", e);
    return NextResponse.json({ error: "Failed to update ambassador" }, { status: 500 });
  }
}
