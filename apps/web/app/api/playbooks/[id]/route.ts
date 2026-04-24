import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import * as repo from "@/modules/playbook-memory/repository/playbook-memory.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [pb, recentMemories, lifecycleEvents] = await Promise.all([
    repo.getMemoryPlaybookById(id),
    prisma.playbookMemoryRecord.findMany({
      where: { memoryPlaybookId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        actionType: true,
        outcomeStatus: true,
        realizedValue: true,
        realizedRevenue: true,
        createdAt: true,
        outcomeEvaluatedAt: true,
      },
    }),
  ]);

  if (!pb) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { versions, currentVersion, ...core } = pb;

  return NextResponse.json({
    ok: true,
    playbook: {
      ...core,
      currentVersionId: core.currentVersionId,
      currentVersion: currentVersion
        ? { id: currentVersion.id, version: currentVersion.version, isActive: currentVersion.isActive, title: currentVersion.title }
        : null,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        isActive: v.isActive,
        title: v.title,
        executions: v.executions,
        successes: v.successes,
        failures: v.failures,
        avgRealizedValue: v.avgRealizedValue,
        avgRevenueLift: v.avgRevenueLift,
        avgConversionLift: v.avgConversionLift,
        avgRiskScore: v.avgRiskScore,
        createdAt: v.createdAt,
        promotedAt: v.promotedAt,
        archivedAt: v.archivedAt,
      })),
    },
    lifecycleEvents,
    recentMemories,
  });
}
