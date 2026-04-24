import type { Deal } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateFormSchema } from "./form-schema";
import { listMissingCriticalNoticeAcks } from "./notice-ack.service";
import { isProductionGuardRelaxed, productionGuardComplianceMinScore } from "./production-mode";
import { recordProductionGuardAudit } from "./audit-service";
import { assertAiDraftClearForSignature } from "@/modules/ai-drafting-correction/turbo-draft-gate";

export type SignatureGateInput = {
  deal: Pick<Deal, "id" | "brokerId" | "listingId" | "executionMetadata">;
  userId: string;
  /** When set, enforced against ProductionGuard registry (strict in production). */
  formKey?: string;
  formVersion?: string;
  formPayload?: unknown;
  /** Optional: same as `deal.executionMetadata.productionGuard.aiDraftId` when not yet persisted. */
  aiDraftIdOverride?: string | null;
};

async function resolveComplianceScore(deal: SignatureGateInput["deal"]): Promise<number | null> {
  if (deal.brokerId) {
    const row = await prisma.complianceScore.findFirst({
      where: {
        ownerType: "solo_broker",
        ownerId: deal.brokerId,
        scopeType: "deal",
        scopeId: deal.id,
      },
      orderBy: { lastComputedAt: "desc" },
      select: { score: true },
    });
    if (row) return row.score;
  }
  if (deal.listingId) {
    const l = await prisma.listing.findUnique({
      where: { id: deal.listingId },
      select: { complianceScore: true },
    });
    if (l?.complianceScore != null) return l.complianceScore;
  }
  return null;
}

function parseAiDraftId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const pg = (metadata as Record<string, unknown>).productionGuard;
  if (!pg || typeof pg !== "object") return null;
  const id = (pg as Record<string, unknown>).aiDraftId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function parsePaymentRequirement(metadata: unknown): string[] | null {
  if (!metadata || typeof metadata !== "object") return null;
  const pg = (metadata as Record<string, unknown>).productionGuard;
  if (!pg || typeof pg !== "object") return null;
  const raw = (pg as Record<string, unknown>).requirePaidPaymentTypes;
  if (!Array.isArray(raw)) return null;
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

async function hasUnpaidRequiredPayments(dealId: string, types: string[]): Promise<boolean> {
  const pending = await prisma.platformPayment.findFirst({
    where: {
      dealId,
      paymentType: { in: types },
      status: { notIn: ["paid", "completed", "succeeded", "PAID", "COMPLETED", "SUCCEEDED"] },
    },
    select: { id: true },
  });
  return Boolean(pending);
}

/**
 * Central signature gate — server-side; callers must await before creating signature sessions or recording binds.
 */
export async function validateBeforeSignature(
  input: SignatureGateInput,
): Promise<{ ok: true } | { ok: false; errors: string[]; blockingReasons: string[] }> {
  const errors: string[] = [];
  const blockingReasons: string[] = [];

  const minScore = productionGuardComplianceMinScore();
  const score = await resolveComplianceScore(input.deal);
  if (score == null) {
    const msg = "Compliance score unavailable for this deal/listing scope.";
    errors.push(msg);
    if (!isProductionGuardRelaxed()) {
      blockingReasons.push("COMPLIANCE_SCORE_UNAVAILABLE");
    }
  } else if (score < minScore) {
    errors.push(`Compliance score ${score} is below required minimum ${minScore}.`);
    blockingReasons.push("COMPLIANCE_BELOW_THRESHOLD");
  }

  const missingNotices = await listMissingCriticalNoticeAcks(input.deal.id, input.userId);
  if (missingNotices.length) {
    errors.push(`Critical notices not acknowledged: ${missingNotices.join(", ")}`);
    blockingReasons.push("CRITICAL_NOTICES_INCOMPLETE");
  }

  const payTypes = parsePaymentRequirement(input.deal.executionMetadata);
  if (payTypes?.length) {
    const unpaid = await hasUnpaidRequiredPayments(input.deal.id, payTypes);
    if (unpaid) {
      errors.push("Required deal payments are not completed.");
      blockingReasons.push("PAYMENT_INCOMPLETE");
    }
  }

  if (input.formKey && input.formVersion && input.formPayload !== undefined) {
    const v = validateFormSchema(input.formKey, input.formVersion, input.formPayload);
    if (!v.ok) {
      errors.push(...v.errors);
      blockingReasons.push("FORM_SCHEMA_INVALID");
    }
  }

  const aiDraftId =
    (input.aiDraftIdOverride?.trim() || null) ?? parseAiDraftId(input.deal.executionMetadata);
  if (aiDraftId) {
    const aiGate = await assertAiDraftClearForSignature(aiDraftId, input.userId);
    if (!aiGate.ok) {
      errors.push(...aiGate.errors);
      blockingReasons.push("AI_DRAFT_REVIEW_INCOMPLETE");
    }
  }

  const ok = blockingReasons.length === 0;

  await recordProductionGuardAudit({
    dealId: input.deal.id,
    actorUserId: input.userId,
    action: ok ? "signature_allowed" : "signature_blocked",
    metadata: { blockingReasons, errorCount: errors.length },
    diff: { errors },
  });

  if (ok) return { ok: true };
  return { ok: false, errors, blockingReasons };
}
