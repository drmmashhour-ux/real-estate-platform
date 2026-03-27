import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["approved", "rejected", "needs_correction", "pending"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { listingId } = await params;
  const body = await request.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!ALLOWED.has(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  const adminNote = typeof body.adminNote === "string" ? body.adminNote : undefined;

  const row = await prisma.listingComplianceReview.upsert({
    where: { listingId },
    create: {
      listingId,
      status,
      reviewedById: userId,
      reviewedAt: new Date(),
      adminNote: adminNote ?? null,
    },
    update: {
      status,
      reviewedById: userId,
      reviewedAt: new Date(),
      adminNote: adminNote ?? null,
    },
  });
  return Response.json(row);
}
