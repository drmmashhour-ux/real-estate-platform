import { prisma } from "@/lib/db";
import { logEvolution } from "./evolution-logger";
import { EvolutionPolicyAdjustment, PolicyRolloutStatus } from "@prisma/client";

const TAG = "[evolution-rollout]";

/**
 * Policy Rollout Engine: Safely apply approved policy changes using progressive rollout.
 */

export const ROLLOUT_STEPS = [5, 10, 25, 50, 100];

export async function applyPolicyWithRollout(policyAdjustmentId: string) {
  // @ts-ignore
  const policy = await prisma.evolutionPolicyAdjustment.findUnique({
    where: { id: policyAdjustmentId },
    include: { rollout: true },
  });

  if (!policy) throw new Error("Policy adjustment not found");
  if (policy.status !== "APPROVED") throw new Error("Policy must be approved before rollout");

  const { isSystemReadyForEvolution } = await import("@/modules/acceptance/checklist.engine");
  const ready = await isSystemReadyForEvolution();
  if (!ready) throw new Error("Rollout blocked: System failed final acceptance checklist");

  // @ts-ignore
  if (policy.rollout) {
    return policy.rollout;
  }

  // Create initial rollout
  // @ts-ignore
  const rollout = await prisma.policyRollout.create({
    data: {
      policyAdjustmentId,
      status: "ACTIVE",
      rolloutPercent: ROLLOUT_STEPS[0],
    },
  });

  logEvolution("rollout", { event: "started", policyAdjustmentId, rolloutId: rollout.id, percent: ROLLOUT_STEPS[0] });

  return rollout;
}

/**
 * Advance rollout to the next percentage step.
 */
export async function advanceRollout(rolloutId: string) {
  // @ts-ignore
  const rollout = await prisma.policyRollout.findUnique({
    where: { id: rolloutId },
  });

    if (!rollout || rollout.status !== "ACTIVE") return null;

    const { isSystemReadyForEvolution } = await import("@/modules/acceptance/checklist.engine");
    const ready = await isSystemReadyForEvolution();
    if (!ready) {
      logEvolution("rollout", { event: "advance_blocked", rolloutId, reason: "Acceptance checklist failed" });
      return rollout;
    }

    const currentIndex = ROLLOUT_STEPS.indexOf(rollout.rolloutPercent);
  if (currentIndex === -1 || currentIndex === ROLLOUT_STEPS.length - 1) {
    if (rollout.rolloutPercent === 100) {
      // @ts-ignore
      return await prisma.policyRollout.update({
        where: { id: rolloutId },
        data: { status: "COMPLETED" },
      });
    }
    return rollout;
  }

  const nextPercent = ROLLOUT_STEPS[currentIndex + 1];
  
  // @ts-ignore
  const updated = await prisma.policyRollout.update({
    where: { id: rolloutId },
    data: { 
      rolloutPercent: nextPercent,
      status: nextPercent === 100 ? "COMPLETED" : "ACTIVE",
    },
  });

  logEvolution("rollout", { event: "advanced", rolloutId, percent: nextPercent });

  return updated;
}

/**
 * Emergency rollback of a policy rollout.
 */
export async function rollbackRollout(rolloutId: string) {
  // @ts-ignore
  const updated = await prisma.policyRollout.update({
    where: { id: rolloutId },
    data: { 
      status: "ROLLED_BACK",
      rolloutPercent: 0,
    },
  });

  logEvolution("rollout", { event: "rolled_back", rolloutId });

  return updated;
}

/**
 * Deterministic traffic splitting using userId hashing.
 */
export function isUserInRollout(userId: string, rolloutPercent: number): boolean {
  if (rolloutPercent >= 100) return true;
  if (rolloutPercent <= 0) return false;

  // Simple numeric hash of userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const bucket = Math.abs(hash) % 100;
  return bucket < rolloutPercent;
}
