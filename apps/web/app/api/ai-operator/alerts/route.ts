import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET /api/ai-operator/alerts – List AI Operator alerts (from Prisma). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("alertType") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const where: { alertType?: string; status?: string } = {};
    if (alertType) where.alertType = alertType;
    if (status) where.status = status;

    const alerts = await prisma.aiOperatorAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    return Response.json({ alerts });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list alerts" }, { status: 500 });
  }
}
