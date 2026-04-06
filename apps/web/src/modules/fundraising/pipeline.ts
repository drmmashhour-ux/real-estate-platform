import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isFundraisingDealStatus,
  isFundraisingStage,
  type FundraisingDealStatus,
  type FundraisingStage,
} from "./constants";

export type FundraisingRecentInteraction = Prisma.FundraisingInvestorInteractionGetPayload<{
  include: { investor: { select: { id: true; name: true; firm: true; stage: true } } };
}>;

export type CreateInvestorInput = {
  name: string;
  email: string;
  firm?: string;
  stage?: FundraisingStage;
  notes?: string | null;
};

export async function createInvestor(input: CreateInvestorInput) {
  const stage = input.stage ?? "contacted";
  if (!isFundraisingStage(stage)) throw new Error(`Invalid stage: ${stage}`);
  return prisma.fundraisingInvestor.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      firm: (input.firm ?? "").trim(),
      stage,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateStage(investorId: string, stage: FundraisingStage) {
  if (!isFundraisingStage(stage)) throw new Error(`Invalid stage: ${stage}`);
  return prisma.fundraisingInvestor.update({
    where: { id: investorId },
    data: { stage },
  });
}

export async function logInteraction(investorId: string, type: string, summary: string) {
  const s = summary.trim();
  if (!s) throw new Error("summary required");
  return prisma.fundraisingInvestorInteraction.create({
    data: {
      investorId,
      type: type.trim(),
      summary: s,
    },
  });
}

export type PipelineSummary = {
  totalInvestors: number;
  byStage: Record<string, number>;
  pipelineValueOpenCommitted: number;
  committedValue: number;
  closedValue: number;
  recentInteractions: FundraisingRecentInteraction[];
};

export async function listFundraisingInvestors() {
  return prisma.fundraisingInvestor.findMany({
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { interactions: true, deals: true } },
    },
  });
}

export async function getPipelineSummary(takeRecent = 25): Promise<PipelineSummary> {
  const [investors, deals, recentInteractions] = await Promise.all([
    prisma.fundraisingInvestor.findMany({ select: { stage: true } }),
    prisma.fundraisingDeal.findMany({ select: { status: true, amount: true } }),
    prisma.fundraisingInvestorInteraction.findMany({
      orderBy: { createdAt: "desc" },
      take: takeRecent,
      include: { investor: { select: { id: true, name: true, firm: true, stage: true } } },
    }),
  ]);

  const byStage: Record<string, number> = {};
  for (const inv of investors) {
    byStage[inv.stage] = (byStage[inv.stage] ?? 0) + 1;
  }

  let pipelineValueOpenCommitted = 0;
  let committedValue = 0;
  let closedValue = 0;
  for (const d of deals) {
    if (d.status === "open" || d.status === "committed") {
      pipelineValueOpenCommitted += d.amount;
    }
    if (d.status === "committed") committedValue += d.amount;
    if (d.status === "closed") closedValue += d.amount;
  }

  return {
    totalInvestors: investors.length,
    byStage,
    pipelineValueOpenCommitted,
    committedValue,
    closedValue,
    recentInteractions,
  };
}

export async function updateDealStatus(dealId: string, status: FundraisingDealStatus) {
  if (!isFundraisingDealStatus(status)) throw new Error(`Invalid deal status: ${status}`);
  return prisma.fundraisingDeal.update({
    where: { id: dealId },
    data: { status },
  });
}

export async function createDeal(investorId: string, amount: number, status: FundraisingDealStatus = "open") {
  if (!isFundraisingDealStatus(status)) throw new Error(`Invalid deal status: ${status}`);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("amount must be a non-negative number");
  return prisma.fundraisingDeal.create({
    data: { investorId, amount, status },
  });
}
