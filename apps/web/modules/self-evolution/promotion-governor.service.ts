import { prisma } from "@repo/db";
import { parsePolicyFromDb } from "./evolution-policy-defaults";
import { getDefaultPolicySnapshot } from "./evolution-policy-defaults";
import { selfEvolutionLog } from "./self-evolution-logger";
import type { EvolutionPromotionDecision } from "./self-evolution.types";
import { applyProposedVersion } from "./version-adapters";

async function getPolicy() {
  return parsePolicyFromDb(
    (await prisma.evolutionPolicy.findFirst({ where: { isActive: true, scopeType: "GLOBAL" } })) as Parameters<typeof parsePolicyFromDb>[0]
  );
}

export async function evaluatePromotionEligibility(proposalId: string): Promise<EvolutionPromotionDecision> {
  try {
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p) {
      return { eligible: false, canAutoPromote: false, requireHuman: true, reason: ["not found"], policy: getDefaultPolicySnapshot() };
    }
    const pol = await getPolicy();
    const allowed = pol.allowedSelfPromotionCategories;
    const needAppr = pol.approvalRequiredCategories;
    const inAllowed = allowed.includes(p.category);
    const needsApproval = needAppr.includes(p.category);
    const canAuto = p.riskLevel === "LOW" && inAllowed && !needsApproval && p.status === "SANDBOXED";
    const eligible = ["SANDBOXED", "READY_FOR_REVIEW", "APPROVED"].includes(p.status);
    return {
      eligible: eligible && p.status !== "PROMOTED" && p.status !== "REJECTED" && p.status !== "ROLLED_BACK",
      canAutoPromote: canAuto,
      requireHuman: !canAuto,
      reason: [
        inAllowed ? "category in auto allowlist" : "category not auto",
        needsApproval ? "category requires human approval" : "no hard approval list hit",
        `risk=${p.riskLevel}`,
      ],
      policy: pol,
    };
  } catch {
    return { eligible: false, canAutoPromote: false, requireHuman: true, reason: ["err"], policy: getDefaultPolicySnapshot() };
  }
}

export async function autoPromoteIfAllowed(proposalId: string): Promise<{ ok: boolean; message: string }> {
  const el = await evaluatePromotionEligibility(proposalId);
  if (!el.eligible) {
    return { ok: false, message: "not eligible" };
  }
  if (el.requireHuman && !el.canAutoPromote) {
    return { ok: false, message: "human required" };
  }
  if (!el.canAutoPromote) {
    return { ok: false, message: "auto not allowed" };
  }
  try {
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p) return { ok: false, message: "not found" };
    const a = applyProposedVersion(p.category, p.proposedVersionKey, p.proposalJson as Record<string, unknown>);
    if (!a.ok) {
      return { ok: false, message: a.error ?? "adapter" };
    }
    await prisma.evolutionPromotionEvent.create({
      data: { proposalId, decision: "PROMOTED", decidedBy: "SYSTEM", reasonJson: { path: "auto", adapter: a.trace } },
    });
    await prisma.evolutionProposal.update({ where: { id: proposalId }, data: { status: "PROMOTED", promotedAt: new Date() } });
    selfEvolutionLog.promoted({ proposalId, by: "auto" });
    return { ok: true, message: "promoted" };
  } catch (e) {
    selfEvolutionLog.warn("autoPromote", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, message: "err" };
  }
}

/**
 * Human promotion (or forced path). `actorUserId` required if not auto.
 */
export async function promoteProposal(
  proposalId: string,
  opts?: { actorUserId?: string; useAutoPath?: boolean }
): Promise<{ ok: boolean; message: string }> {
  if (opts?.useAutoPath) {
    return autoPromoteIfAllowed(proposalId);
  }
  try {
    if (!opts?.actorUserId) {
      return { ok: false, message: "actor user required" };
    }
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p) {
      return { ok: false, message: "not found" };
    }
    if (p.status === "PROMOTED" || p.status === "REJECTED" || p.status === "ROLLED_BACK") {
      return { ok: false, message: "terminal status" };
    }
    if (p.status === "DRAFT") {
      return { ok: false, message: "run sandbox first" };
    }
    const a = applyProposedVersion(p.category, p.proposedVersionKey, p.proposalJson as Record<string, unknown>);
    if (!a.ok) {
      return { ok: false, message: a.error ?? "adapter" };
    }
    await prisma.evolutionPromotionEvent.create({
      data: {
        proposalId,
        decision: "PROMOTED",
        decidedBy: "HUMAN",
        decidedByUserId: opts.actorUserId,
        reasonJson: { via: "manual", adapter: a.trace },
      },
    });
    await prisma.evolutionProposal.update({
      where: { id: proposalId },
      data: { status: "PROMOTED", promotedAt: new Date(), approvedByUserId: opts.actorUserId },
    });
    selfEvolutionLog.promoted({ proposalId, by: "human" });
    return { ok: true, message: "promoted" };
  } catch (e) {
    selfEvolutionLog.warn("promote", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, message: "error" };
  }
}

export async function rejectProposal(proposalId: string, actorUserId: string, reason: string): Promise<{ ok: boolean; message: string }> {
  try {
    await prisma.evolutionPromotionEvent.create({
      data: { proposalId, decision: "REJECTED", decidedBy: "HUMAN", decidedByUserId: actorUserId, reasonJson: { reason } },
    });
    await prisma.evolutionProposal.update({ where: { id: proposalId }, data: { status: "REJECTED" } });
    selfEvolutionLog.rejected({ proposalId });
    return { ok: true, message: "rejected" };
  } catch {
    return { ok: false, message: "err" };
  }
}
