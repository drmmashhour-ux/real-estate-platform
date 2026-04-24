import type { LecipmSystemAdjustmentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

import { aiCeoLog } from "./ai-ceo-log";

const BLOCKED_KEYWORDS = [
  "punitive",
  "hide listing",
  "shadowban",
  "legal determination",
  "guaranteed return",
];

export type ProposeAdjustmentInput = {
  title: string;
  affectedDomain: string;
  territory?: string | null;
  segment?: string | null;
  hub?: string | null;
  impactBand: string;
  confidence: number;
  urgency: string;
  recommendedAdjustment: string;
  explanation: string;
  proposedByUserId?: string | null;
};

/**
 * Validates recommendation text for **unsafe** automation patterns (heuristic guard — not legal review).
 */
export function validateBoundedAdjustmentText(text: string): { ok: true } | { ok: false; reason: string } {
  const lower = text.toLowerCase();
  for (const k of BLOCKED_KEYWORDS) {
    if (lower.includes(k)) {
      return { ok: false, reason: `Blocked keyword hint: ${k}` };
    }
  }
  return { ok: true };
}

export async function proposeSystemAdjustment(input: ProposeAdjustmentInput) {
  const v = validateBoundedAdjustmentText(
    `${input.recommendedAdjustment}\n${input.explanation}`
  );
  if (!v.ok) {
    throw new Error(v.reason);
  }

  const row = await prisma.lecipmSystemBehaviorAdjustment.create({
    data: {
      title: input.title.slice(0, 280),
      affectedDomain: input.affectedDomain.slice(0, 64),
      territory: input.territory?.slice(0, 120) ?? null,
      segment: input.segment?.slice(0, 120) ?? null,
      hub: input.hub?.slice(0, 120) ?? null,
      impactBand: input.impactBand.slice(0, 32),
      confidence: Math.min(1, Math.max(0, input.confidence)),
      urgency: input.urgency.slice(0, 24),
      recommendedAdjustment: input.recommendedAdjustment,
      explanation: input.explanation,
      proposedByUserId: input.proposedByUserId ?? null,
      status: "PROPOSED",
    },
  });

  logAiCeoEvent("system_adjustment_proposed", { id: row.id, domain: row.affectedDomain });
  return row;
}

export async function approveSystemAdjustment(input: {
  id: string;
  approvedByUserId: string;
  approvalReason: string;
  expectedEffect?: string | null;
}) {
  const row = await prisma.lecipmSystemBehaviorAdjustment.update({
    where: { id: input.id },
    data: {
      status: "APPROVED",
      approvedByUserId: input.approvedByUserId,
      approvalReason: input.approvalReason,
      expectedEffect: input.expectedEffect ?? null,
    },
  });
  aiCeoLog("info", "system_adjustment_approved", { id: row.id, by: input.approvedByUserId });
  return row;
}

export async function rejectSystemAdjustment(input: {
  id: string;
  approvedByUserId: string;
  approvalReason: string;
}) {
  return prisma.lecipmSystemBehaviorAdjustment.update({
    where: { id: input.id },
    data: {
      status: "REJECTED",
      approvedByUserId: input.approvedByUserId,
      approvalReason: input.approvalReason,
    },
  });
}

export async function markAdjustmentImplemented(input: {
  id: string;
  measuredOutcomeJson?: Prisma.InputJsonValue;
}) {
  return prisma.lecipmSystemBehaviorAdjustment.update({
    where: { id: input.id },
    data: {
      status: "IMPLEMENTED",
      implementedAt: new Date(),
      measuredOutcomeJson: input.measuredOutcomeJson,
    },
  });
}

export async function markAdjustmentReversed(input: {
  id: string;
  measuredOutcomeJson?: Prisma.InputJsonValue;
}) {
  return prisma.lecipmSystemBehaviorAdjustment.update({
    where: { id: input.id },
    data: {
      status: "REVERSED",
      reversedAt: new Date(),
      measuredOutcomeJson: input.measuredOutcomeJson,
    },
  });
}

export async function listAdjustmentsByStatus(status: LecipmSystemAdjustmentStatus, take = 40) {
  return prisma.lecipmSystemBehaviorAdjustment.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take,
  });
}
