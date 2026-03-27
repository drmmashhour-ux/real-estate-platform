import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/brokers/applications/:id/reject – Reject broker application.
 * Body: { notes?: string }. Sets user.brokerStatus = REJECTED.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getGuestId();
    if (!adminId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
    if (admin?.role !== "ADMIN") return Response.json({ error: "Admin only" }, { status: 403 });

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    const app = await prisma.brokerApplication.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });
    if (!app) return Response.json({ error: "Application not found" }, { status: 404 });
    if (app.status !== "pending") return Response.json({ error: "Application already processed" }, { status: 400 });

    await prisma.$transaction([
      prisma.brokerApplication.update({
        where: { id },
        data: { status: "rejected", reviewedBy: adminId, reviewedAt: new Date(), notes },
      }),
      prisma.user.update({
        where: { id: app.userId },
        data: { brokerStatus: "REJECTED", accountStatus: "RESTRICTED" },
      }),
    ]);

    return Response.json({ success: true, message: "Application rejected." });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Reject failed" }, { status: 500 });
  }
}
