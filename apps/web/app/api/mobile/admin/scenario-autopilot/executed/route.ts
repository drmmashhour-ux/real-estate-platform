import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const u = await requireMobileAdmin(request);
    const rows = await prisma.lecipmScenarioAutopilotRun.findMany({
      where: { userId: u.id, status: { in: ["EXECUTED", "REVERSED"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        status: true,
        bestCandidateId: true,
        outcomeJson: true,
        executionLogJson: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      executed: rows.map((r) => ({
        id: r.id,
        status: r.status,
        bestCandidateId: r.bestCandidateId,
        outcomeJson: r.outcomeJson,
        hasExecutionLog: r.executionLogJson != null,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
