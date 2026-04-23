import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/** POST /api/admin/developer/applications/:id/approve – Approve developer application. Sets user.role = DEVELOPER, accountStatus = ACTIVE. */
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
    const app = await prisma.developerApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });
    if (!app) return Response.json({ error: "Application not found" }, { status: 404 });
    if (app.status !== "pending") return Response.json({ error: "Application already processed" }, { status: 400 });

    await prisma.$transaction([
      prisma.developerApplication.update({
        where: { id },
        data: { status: "approved", reviewedBy: adminId, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: app.userId },
        data: { role: "DEVELOPER", accountStatus: "ACTIVE" },
      }),
    ]);

    return Response.json({ success: true, message: "Developer approved." });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Approval failed" }, { status: 500 });
  }
}
