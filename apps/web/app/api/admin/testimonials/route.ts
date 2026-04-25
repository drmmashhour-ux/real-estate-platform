import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listPendingTestimonials } from "@/modules/growth/broker-testimonial.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listPendingTestimonials();
  return NextResponse.json({ testimonials: rows });
}
