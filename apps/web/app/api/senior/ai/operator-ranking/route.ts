import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.seniorOperatorPerformance.findMany({
      take: 80,
      orderBy: { updatedAt: "desc" },
      include: { residence: { select: { id: true, name: true, city: true } } },
    });
    rows.sort((a, b) => (b.operatorScore ?? -1) - (a.operatorScore ?? -1));
    return NextResponse.json({
      rankings: rows.map((r) => ({
        residenceId: r.residenceId,
        name: r.residence.name,
        city: r.residence.city,
        operatorScore: r.operatorScore,
      })),
    });
  } catch (e) {
    logError("[api.senior.ai.operator-ranking]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
