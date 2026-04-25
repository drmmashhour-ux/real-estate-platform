import { prisma } from "@repo/db";
import { getDefaultPolicySnapshot, parsePolicyFromDb } from "./evolution-policy-defaults";
import { selfEvolutionLog } from "./self-evolution-logger";
import type { EvolutionRollbackDecision } from "./self-evolution.types";

async function getRollbackThresholds() {
  return parsePolicyFromDb(
    (await prisma.evolutionPolicy.findFirst({ where: { isActive: true, scopeType: "GLOBAL" } })) as Parameters<typeof parsePolicyFromDb>[0]
  );
}

/**
 * Compares latest experiment to baseline; suggests rollback if degradation exceeds policy (no auto-exec of rollback without call site).
 */
export async function evaluateRollbackNeed(proposalId: string): Promise<EvolutionRollbackDecision> {
  const pol = (await getRollbackThresholds()) ?? getDefaultPolicySnapshot();
  const maxD = pol.maxDegradationVsBaseline;
  try {
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p) {
      return { shouldRollback: false, reason: "not found", currentVersionToRestore: "" };
    }
    const ex = await prisma.evolutionExperiment.findFirst({ where: { proposalId }, orderBy: { createdAt: "desc" } });
    const rj = ex?.resultJson as { degradation?: number; improvement?: number } | null;
    const degr = rj?.degradation ?? 0;
    if (p.status === "PROMOTED" && degr > maxD) {
      return {
        shouldRollback: true,
        reason: `degradation ${degr.toFixed(3)} over threshold ${maxD}`,
        currentVersionToRestore: p.currentVersionKey,
      };
    }
    if (p.status === "PROMOTED" && (rj?.improvement ?? 0) < 0) {
      return { shouldRollback: true, reason: "negative net improvement in ledger experiment", currentVersionToRestore: p.currentVersionKey };
    }
    selfEvolutionLog.rollbackEval({ proposalId, degr, max: maxD, should: false });
    return { shouldRollback: false, reason: "within band or not promoted", currentVersionToRestore: p.currentVersionKey };
  } catch (e) {
    selfEvolutionLog.warn("rollback_eval", { err: e instanceof Error ? e.message : String(e) });
    return { shouldRollback: false, reason: "unavailable", currentVersionToRestore: "" };
  }
}

export async function rollbackPromotedChange(
  proposalId: string,
  opts?: { actorUserId?: string; reason?: string; force?: boolean }
): Promise<{ ok: boolean; message: string }> {
  try {
    const ev = await evaluateRollbackNeed(proposalId);
    if (!ev.shouldRollback && !opts?.force) {
      return { ok: false, message: "no rollback by policy" };
    }
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p || p.status !== "PROMOTED") {
      return { ok: false, message: "not promoted" };
    }
    const restore = ev.currentVersionToRestore || p.currentVersionKey;
    await prisma.evolutionPromotionEvent.create({
      data: {
        proposalId,
        decision: "ROLLED_BACK",
        decidedBy: opts?.actorUserId ? "HUMAN" : "SYSTEM",
        decidedByUserId: opts?.actorUserId,
        reasonJson: { reason: opts?.reason ?? (opts?.force ? "forced" : "threshold"), restore },
      },
    });
    await prisma.evolutionProposal.update({
      where: { id: proposalId },
      data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
    });
    selfEvolutionLog.rollbackExec({ proposalId, restored: ev.currentVersionToRestore });
    return { ok: true, message: "rolled back" };
  } catch (e) {
    selfEvolutionLog.warn("rollback", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, message: "err" };
  }
}

export function createRollbackDecision(need: EvolutionRollbackDecision) {
  return { ...need, versionRestored: need.currentVersionToRestore };
}
