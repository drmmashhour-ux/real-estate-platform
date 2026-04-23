import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/admin/fraud-alerts
 * List fraud alerts with optional status filter.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // NEW | REVIEWING | RESOLVED | DISMISSED
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const where = status ? { status: status as "NEW" | "REVIEWING" | "RESOLVED" | "DISMISSED" } : {};

    const alerts = await prisma.fraudAlert.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ alerts });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch fraud alerts" }, { status: 500 });
  }
}
