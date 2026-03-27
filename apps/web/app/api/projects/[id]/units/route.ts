import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json().catch(() => ({}));
    const { type, price, size, status = "available" } = body;
    if (!type || typeof price !== "number" || typeof size !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: type, price, size" },
        { status: 400 }
      );
    }
    const unit = await prisma.projectUnit.create({
      data: {
        projectId,
        type,
        price,
        size,
        status: status || "available",
      },
    });
    return NextResponse.json(unit);
  } catch (e) {
    console.error("POST /api/projects/[id]/units:", e);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
