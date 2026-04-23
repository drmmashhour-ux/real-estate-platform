import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status")?.trim();
    const riskLevel = sp.get("riskLevel")?.trim();
    const take = Math.min(100, Math.max(1, Number(sp.get("limit")) || 50));

    const alerts = await prisma.legalAlert.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(riskLevel ? { riskLevel } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });
    return NextResponse.json({ alerts });
  } catch (e) {
    console.error("GET /api/legal/alerts", e);
    return NextResponse.json({ alerts: [] }, { status: 200 });
  }
}
