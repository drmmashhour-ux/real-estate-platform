import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/brokers/applications – List broker applications (admin).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    // In production: enforce admin role from User.role or cookie
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") return Response.json({ error: "Admin only" }, { status: 403 });

    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const applications = await prisma.brokerApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, brokerStatus: true } },
      },
    });
    return Response.json({ applications });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list applications" }, { status: 500 });
  }
}
