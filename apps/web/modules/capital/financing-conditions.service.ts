import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { logDealCapitalTimeline } from "./capital-timeline.service";
import { canWaiveCriticalFinancingCondition } from "./capital-policy";

const TAG = "[capital.financing-conditions]";

export async function listFinancingConditions(dealId: string) {
  return prisma.lecipmPipelineDealFinancingCondition.findMany({
    where: { dealId },
    orderBy: [{ isCritical: "desc" }, { createdAt: "asc" }],
  });
}

export async function generateConditionsFromOffer(offerId: string, actorUserId: string | null) {
  await prisma.$transaction(async (tx) => {
    await generateConditionsFromOfferTx(tx, offerId, actorUserId);
  });
}

export async function generateConditionsFromOfferTx(
  tx: Prisma.TransactionClient,
  offerId: string,
  actorUserId: string | null
) {
  const offer = await tx.lecipmPipelineDealLenderOffer.findUnique({
    where: { id: offerId },
    include: { lender: true },
  });
  if (!offer) throw new Error("Offer not found");

  const dealId = offer.dealId;
  const templates: Array<{ title: string; description?: string; isCritical: boolean }> = [
    { title: "Appraisal meets or exceeds purchase (lender threshold)", isCritical: true },
    { title: "Proof of income / employment on file", isCritical: true },
    { title: "Property insurance confirmation", isCritical: true },
    { title: "Down payment / equity source verification", isCritical: true },
  ];

  const fromJson = offer.conditionsJson;
  if (Array.isArray(fromJson)) {
    for (const item of fromJson) {
      if (item && typeof item === "object" && "title" in item && typeof (item as { title: unknown }).title === "string") {
        templates.push({
          title: (item as { title: string }).title.slice(0, 512),
          description: typeof (item as { description?: string }).description === "string" ? (item as { description: string }).description : undefined,
          isCritical: (item as { critical?: boolean }).critical !== false,
        });
      }
    }
  }

  for (const t of templates) {
    const row = await tx.lecipmPipelineDealFinancingCondition.create({
      data: {
        dealId,
        lenderOfferId: offerId,
        title: t.title,
        description: t.description?.slice(0, 8000),
        status: "OPEN",
        isCritical: t.isCritical,
      },
    });
    await appendDealAuditEvent(tx, {
      dealId,
      eventType: "FINANCING_CONDITION_CREATED",
      actorUserId,
      summary: `Financing condition: ${row.title}`,
      metadataJson: { conditionId: row.id, offerId },
    });
  }

  await logDealCapitalTimeline(dealId, "FINANCING_CONDITION_CREATED", `Conditions from offer ${offerId}`);
  logInfo(TAG, { offerId, count: templates.length });
}

type UpdateFinancingStatusInput = {
  status: string;
  note?: string | null;
  actorUserId: string | null;
  actorRole: import("@prisma/client").PlatformRole;
};

export async function updateFinancingConditionStatus(conditionId: string, input: UpdateFinancingStatusInput) {
  const cond = await prisma.lecipmPipelineDealFinancingCondition.findUnique({ where: { id: conditionId } });
  if (!cond) throw new Error("Financing condition not found");

  const st = input.status.slice(0, 16).toUpperCase();
  if (st === "WAIVED" && !input.note?.trim()) {
    throw new Error("Waiving a financing condition requires a note");
  }
  if (st === "WAIVED" && cond.isCritical && !canWaiveCriticalFinancingCondition(input.actorRole)) {
    throw new Error("Only ADMIN may waive critical financing conditions");
  }

  const row = await prisma.lecipmPipelineDealFinancingCondition.update({
    where: { id: conditionId },
    data: {
      status: st,
      ...(st === "WAIVED" ? { waiverNote: input.note!.trim().slice(0, 8000) } : {}),
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId: cond.dealId,
    eventType: "FINANCING_CONDITION_STATUS_UPDATED",
    actorUserId: input.actorUserId,
    summary: `Financing condition "${cond.title}" → ${st}`,
    metadataJson: { conditionId, status: st, note: input.note ?? null },
  });

  await maybeEmitFinancingApproved(cond.dealId);

  logInfo(TAG, { conditionId, status: st });
  return row;
}

/** When all critical financing conditions are SATISFIED or WAIVED, emit timeline + audit once per evaluation cycle. */
async function maybeEmitFinancingApproved(dealId: string): Promise<void> {
  const criticalOpen = await prisma.lecipmPipelineDealFinancingCondition.count({
    where: {
      dealId,
      isCritical: true,
      status: { notIn: ["SATISFIED", "WAIVED"] },
    },
  });
  if (criticalOpen > 0) return;

  const already = await prisma.lecipmPipelineDealAuditEvent.count({
    where: { dealId, eventType: "FINANCING_APPROVED" },
  });
  if (already > 0) return;

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "FINANCING_APPROVED",
    actorUserId: null,
    summary: "All critical financing conditions cleared",
  });
  await logDealCapitalTimeline(dealId, "FINANCING_APPROVED", "All critical financing conditions satisfied or waived");
}
