import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";

const DEFAULT_TAKE = 500;

/**
 * v1: scan recent assignments, report bandit table size, and flag obvious stat gaps (conservative, diagnostic).
 */
export async function runPlaybookBanditRollup(params?: { maxRows?: number }): Promise<{
  assignmentsScanned: number;
  banditRowCount: number;
  lastAssignmentId: string | null;
  lastBanditStatId: string | null;
  notes: string;
}> {
  const take = params?.maxRows != null ? Math.min(2000, Math.max(1, params.maxRows)) : DEFAULT_TAKE;
  try {
    const [recent, banditCount, lastA, lastB] = await Promise.all([
      prisma.playbookAssignment.findMany({ orderBy: { createdAt: "desc" }, take, select: { id: true } }),
      prisma.playbookBanditStat.count(),
      prisma.playbookAssignment.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }),
      prisma.playbookBanditStat.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } }),
    ]);
    const notes = "Scanned recent assignment id window; bandit count is total rows (not per-key diff).";
    playbookLog.info("playbookBanditRollup", { assignmentsScanned: recent.length, banditRowCount: banditCount });
    return {
      assignmentsScanned: recent.length,
      banditRowCount: banditCount,
      lastAssignmentId: lastA?.id ?? null,
      lastBanditStatId: lastB?.id ?? null,
      notes,
    };
  } catch (e) {
    playbookLog.error("playbookBanditRollup", { message: e instanceof Error ? e.message : String(e) });
    return {
      assignmentsScanned: 0,
      banditRowCount: 0,
      lastAssignmentId: null,
      lastBanditStatId: null,
      notes: "rollup_failed",
    };
  }
}
