import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { approveTestimonial } from "@/modules/growth/broker-testimonial.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN" && admin?.role !== "OPERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { isApproved?: boolean };
  try {
    body = (await req.json()) as { isApproved?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.isApproved !== "boolean") {
    return NextResponse.json({ error: "isApproved required" }, { status: 400 });
  }

  const row = await approveTestimonial(id, body.isApproved);
  return NextResponse.json(row);
}
