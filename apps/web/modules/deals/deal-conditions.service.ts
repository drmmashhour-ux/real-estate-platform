import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadInvestorListingContext } from "@/modules/investor/investor-context.loader";
import type { ConditionCategory, ConditionStatus } from "@/modules/deals/deal.types";

const TAG = "[deal-condition]";

export async function createCondition(options: {
  dealId: string;
  title: string;
  description?: string | null;
  category: ConditionCategory;
  priority?: string | null;
  ownerUserId?: string | null;
  dueDate?: Date | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineCondition.create({
    data: {
      dealId: options.dealId,
      title: options.title.slice(0, 512),
      description: options.description ?? null,
      category: options.category,
      priority: options.priority ?? "MEDIUM",
      status: "OPEN",
      ownerUserId: options.ownerUserId ?? null,
      dueDate: options.dueDate ?? null,
    },
    select: { id: true },
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      eventType: "CONDITION_ADDED",
      note: options.title.slice(0, 2000),
      metadataJson: { conditionId: row.id, category: options.category },
    },
  });

  logInfo(`${TAG} created`, { dealId: options.dealId, conditionId: row.id });
  return row;
}

export async function seedConditionsFromListing(dealId: string, listingId: string): Promise<number> {
  const ctx = await loadInvestorListingContext(listingId);
  if (!ctx) return 0;
  let n = 0;
  const due = new Date();
  due.setDate(due.getDate() + 30);

  for (const a of ctx.esgActionsOpen.filter((x) => x.priority === "CRITICAL")) {
    await createCondition({
      dealId,
      title: `ESG action: ${a.title}`,
      description: `Source: Action Center (${a.reasonCode}).`,
      category: "ESG",
      priority: "CRITICAL",
      dueDate: due,
    });
    n += 1;
    if (n >= 8) break;
  }

  if ((ctx.esgProfile?.dataCoveragePercent ?? 100) < 50) {
    await createCondition({
      dealId,
      title: "Provide verified utility / disclosure evidence",
      description: "Data coverage below internal threshold — estimated fields must not be treated as verified.",
      category: "DOCUMENTATION",
      priority: "HIGH",
      dueDate: due,
    });
    n += 1;
  }

  return n;
}

export async function setConditionStatus(options: {
  dealId: string;
  conditionId: string;
  status: ConditionStatus;
  actorUserId: string;
  waiverNote?: string | null;
}): Promise<void> {
  const row = await prisma.investmentPipelineCondition.findFirst({
    where: { id: options.conditionId, dealId: options.dealId },
  });
  if (!row) throw new Error("Condition not found");

  if (row.priority === "CRITICAL" && options.status === "WAIVED") {
    if (!options.waiverNote?.trim()) throw new Error("Critical condition waiver requires a note.");
  }

  const data: Parameters<typeof prisma.investmentPipelineCondition.update>[0]["data"] = {
    status: options.status,
    updatedAt: new Date(),
  };

  if (options.status === "SATISFIED") {
    data.satisfiedAt = new Date();
  }
  if (options.status === "WAIVED") {
    data.waiverNote = options.waiverNote ?? null;
    data.waivedByUserId = options.actorUserId;
  }

  await prisma.investmentPipelineCondition.update({
    where: { id: options.conditionId },
    data,
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      actorUserId: options.actorUserId,
      eventType: "CONDITION_STATUS_CHANGED",
      note: `Condition ${options.conditionId} → ${options.status}`,
      metadataJson: { waiverNote: options.waiverNote ?? null },
    },
  });

  logInfo(`${TAG} status`, { dealId: options.dealId, conditionId: options.conditionId, status: options.status });

  const { reconcileAfterArtifactsUpdate } = await import("@/modules/deals/deal-workflow-orchestrator");
  await reconcileAfterArtifactsUpdate(options.dealId, options.actorUserId);
}
