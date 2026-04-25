import { prisma } from "@/lib/db";
import type { AutonomySection, TracedNumber } from "./executive-report.types";
import { parsePeriodKey } from "./period-key";
import type { DataSourceTrace } from "./executive-report.types";

function trace(tables: string[], description: string, partialDataNote?: string): DataSourceTrace {
  return partialDataNote ? { tables, description, partialDataNote } : { tables, description };
}

function num(value: number | null, t: DataSourceTrace): TracedNumber {
  return { value, trace: t };
}

export async function buildAutonomySection(periodKey: string): Promise<AutonomySection> {
  const parsed = parsePeriodKey(periodKey);
  const assumptions: string[] = [
    "Autonomy metrics count `AutonomyAction` rows; status strings are as stored (case-sensitive grouping keys).",
  ];

  if (!parsed) {
    return emptyAutonomy(assumptions, "Invalid periodKey.");
  }

  const { startUtc, endUtcExclusive } = parsed;

  try {
    const [rows, approvals, blocked] = await Promise.all([
      prisma.autonomyAction.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startUtc, lt: endUtcExclusive } },
        _count: { id: true },
      }),
      prisma.autonomyAction.count({
        where: {
          createdAt: { gte: startUtc, lt: endUtcExclusive },
          status: { in: ["executed", "approved", "success", "EXECUTED", "APPROVED", "SUCCESS"] },
        },
      }),
      prisma.autonomyAction.count({
        where: {
          createdAt: { gte: startUtc, lt: endUtcExclusive },
          status: { in: ["rejected", "skipped", "REJECTED", "SKIPPED", "BLOCKED", "blocked"] },
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      byStatus[r.status] = r._count.id;
      total += r._count.id;
    }

    const modeRows = await prisma.autonomyConfig.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { scopeType: true, scopeId: true, mode: true, maxActionsPerCycle: true },
    });

    const autonomyModeSummary =
      modeRows.length === 0 ?
        "No recent autonomy configuration rows found."
      : modeRows
          .map(
            (m) =>
              `${m.scopeType}:${m.scopeId.slice(0, 8)}… mode=${m.mode ?? "unknown"} cap=${m.maxActionsPerCycle ?? "n/a"}`
          )
          .join("; ");

    return {
      actionsCreatedInPeriod: num(
        total,
        trace(["AutonomyAction"], "Actions created in reporting period.")
      ),
      byStatus,
      approvals: num(
        approvals,
        trace(
          ["AutonomyAction"],
          "Count rows whose status is in {executed, approved, success} (case variants as stored)."
        )
      ),
      blockedOrRejected: num(
        blocked,
        trace(
          ["AutonomyAction"],
          "Count rows whose status is in {rejected, skipped, blocked} (case variants as stored)."
        )
      ),
      autonomyModeSummary,
      assumptions,
    };
  } catch {
    return emptyAutonomy(assumptions, "Autonomy section queries failed.");
  }
}

function emptyAutonomy(assumptions: string[], err: string): AutonomySection {
  const z = trace([], err);
  return {
    actionsCreatedInPeriod: { value: null, trace: z },
    byStatus: {},
    approvals: { value: null, trace: z },
    blockedOrRejected: { value: null, trace: z },
    autonomyModeSummary: err,
    assumptions: [...assumptions, err],
  };
}
