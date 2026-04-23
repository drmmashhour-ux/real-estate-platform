import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { evaluateCompliance } from "@/modules/transactions/transaction-compliance.service";
import { appendDealAuditEvent } from "./deal-audit.service";

const TAG = "[deal.conditions]";

export async function listConditions(dealId: string) {
  return prisma.lecipmPipelineDealCondition.findMany({
    where: { dealId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}

export async function getBlockingConditions(dealId: string) {
  return prisma.lecipmPipelineDealCondition.findMany({
    where: { dealId, status: { in: ["OPEN", "IN_PROGRESS", "FAILED"] } },
  });
}

export async function createCondition(
  dealId: string,
  data: {
    title: string;
    description?: string | null;
    category: string;
    priority: string;
    ownerUserId?: string | null;
    dueDate?: Date | null;
  },
  actorUserId: string | null
) {
  const row = await prisma.lecipmPipelineDealCondition.create({
    data: {
      dealId,
      title: data.title.slice(0, 512),
      description: data.description?.slice(0, 8000) ?? undefined,
      category: data.category.slice(0, 24),
      priority: data.priority.slice(0, 16),
      status: "OPEN",
      ownerUserId: data.ownerUserId ?? undefined,
      dueDate: data.dueDate ?? undefined,
    },
  });
  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CONDITION_CREATED",
    actorUserId: actorUserId,
    summary: `Condition: ${row.title}`,
    metadataJson: { conditionId: row.id },
  });
  logInfo(TAG, { action: "create", id: row.id });
  return row;
}

export async function updateConditionStatus(
  conditionId: string,
  status: string,
  input: { note?: string | null; actorUserId: string | null; allowWaive?: boolean }
) {
  const cond = await prisma.lecipmPipelineDealCondition.findUnique({ where: { id: conditionId } });
  if (!cond) throw new Error("Condition not found");

  if (status === "WAIVED" && !input.note?.trim()) {
    throw new Error("Waiver requires a note");
  }
  if (status === "WAIVED" && cond.priority === "CRITICAL" && !input.allowWaive) {
    throw new Error("Critical condition waiver requires admin authorization");
  }

  const notes =
    input.note ?
      cond.notes ?
        `${cond.notes}\n${input.note}`
      : input.note
    : undefined;

  const satisfiedAt =
    status === "SATISFIED" || status === "WAIVED" ? new Date()
    : status === "OPEN" || status === "IN_PROGRESS" || status === "FAILED" ? null
    : undefined;

  const row = await prisma.lecipmPipelineDealCondition.update({
    where: { id: conditionId },
    data: {
      status: status.slice(0, 16),
      ...(notes !== undefined ? { notes } : {}),
      ...(satisfiedAt !== undefined ? { satisfiedAt } : {}),
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId: cond.dealId,
    eventType: "CONDITION_STATUS_UPDATED",
    actorUserId: input.actorUserId,
    summary: `Condition ${row.title} → ${status}`,
    metadataJson: { conditionId, status, note: input.note ?? null },
  });
  logInfo(TAG, { conditionId, status });
  return row;
}

/** Creates template + transaction-derived conditions after committee decision. */
export async function autoGenerateConditionsForDecision(
  dealId: string,
  recommendation: string,
  actorUserId: string | null
) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");

  const templates: { title: string; category: string; priority: string }[] = [];

  if (recommendation === "PROCEED_WITH_CONDITIONS") {
    templates.push(
      {
        title: "Execute signed purchase agreement",
        category: "DOCUMENT",
        priority: "CRITICAL",
      },
      {
        title: "Final financing approval on file",
        category: "FINANCIAL",
        priority: "CRITICAL",
      },
      {
        title: "Resolve compliance blockers on transaction file",
        category: "COMPLIANCE",
        priority: "CRITICAL",
      },
      {
        title: "Notary package ready / sent",
        category: "NOTARY",
        priority: "HIGH",
      }
    );
  }

  if (recommendation === "PROCEED") {
    templates.push({
      title: "Confirm no material outstanding regulatory items",
      category: "COMPLIANCE",
      priority: "MEDIUM",
    });
  }

  for (const t of templates) {
    await createCondition(dealId, t, actorUserId);
  }

  await syncConditionsFromTransactionContext(dealId, actorUserId);
}

export async function syncConditionsFromTransactionContext(dealId: string, actorUserId: string | null) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal?.transactionId) return;

  const evaln = await evaluateCompliance(deal.transactionId, { skipNotarySent: true });
  for (const msg of evaln.blockingIssues.slice(0, 12)) {
    await createCondition(
      dealId,
      {
        title: msg,
        category: "COMPLIANCE",
        priority: "CRITICAL",
        description: "Derived from live transaction compliance evaluation",
      },
      actorUserId
    );
  }
}

export async function seedConditionsFromListing(dealId: string, listingId: string, actorUserId: string | null) {
  // Placeholder to fix build error
  await createCondition(dealId, {
    title: "Verify listing documentation",
    category: "DOCUMENT",
    priority: "MEDIUM",
    description: `Auto-generated for listing ${listingId}`,
  }, actorUserId);
}

export async function setConditionStatus(input: { dealId: string; conditionId: string; status: string; actorUserId: string | null; note?: string | null }) {
  return updateConditionStatus(input.conditionId, input.status, {
    note: input.note,
    actorUserId: input.actorUserId,
    allowWaive: true
  });
}
