import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { FollowUpType } from "@/modules/deals/deal.types";

const TAG = "[deal-followup]";

export async function createFollowUpsForDecision(options: {
  dealId: string;
  recommendation: string;
  actorUserId?: string | null;
  extraTitles?: Array<{ title: string; followUpType: FollowUpType; description?: string }>;
}): Promise<number> {
  const built: Array<{ title: string; followUpType: FollowUpType; description?: string }> = [...(options.extraTitles ?? [])];

  if (options.recommendation === "PROCEED_WITH_CONDITIONS") {
    built.push({
      title: "Track outstanding committee conditions until satisfied or waived",
      followUpType: "CONDITION_CHECK",
      description: "Review conditions panel and assign owners.",
    });
  }
  if (options.recommendation === "PROCEED" || options.recommendation === "DECLINE") {
    built.push({
      title: "Investor / sponsor communication — decision outcome",
      followUpType: "INVESTOR_UPDATE",
    });
  }
  if (options.recommendation === "HOLD") {
    built.push({
      title: "Prepare materials for IC resubmission after diligence",
      followUpType: "DOCUMENT_REQUEST",
    });
  }
  if (options.recommendation === "PROCEED" || options.recommendation === "PROCEED_WITH_CONDITIONS") {
    built.push({
      title: "Execution readiness checklist draft",
      followUpType: "EXECUTION_TASK",
    });
  }

  let n = 0;
  const due = new Date();
  due.setDate(due.getDate() + 14);

  for (const b of built) {
    await prisma.investmentPipelineFollowUp.create({
      data: {
        dealId: options.dealId,
        title: b.title.slice(0, 512),
        description: b.description ?? null,
        followUpType: b.followUpType,
        status: "OPEN",
        ownerUserId: options.actorUserId ?? null,
        dueDate: due,
      },
    });
    n += 1;
  }

  logInfo(`${TAG}`, { dealId: options.dealId, created: n });
  return n;
}

export async function createSingleFollowUp(options: {
  dealId: string;
  title: string;
  description?: string | null;
  followUpType: FollowUpType;
  ownerUserId?: string | null;
  dueDate?: Date | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineFollowUp.create({
    data: {
      dealId: options.dealId,
      title: options.title.slice(0, 512),
      description: options.description ?? null,
      followUpType: options.followUpType,
      status: "OPEN",
      ownerUserId: options.ownerUserId ?? null,
      dueDate: options.dueDate ?? null,
    },
    select: { id: true },
  });
  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      eventType: "FOLLOWUP_CREATED",
      note: options.title.slice(0, 2000),
      metadataJson: { followUpId: row.id },
    },
  });
  logInfo(`${TAG} one`, { dealId: options.dealId, id: row.id });
  return row;
}
