import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { userCanViewPipelineDeal } from "@/modules/deals/deal-access";
import { userCanElevatedCapitalOps } from "@/modules/capital/capital-policy";

export async function userCanAccessCapitalModule(userId: string, pipelineDealId: string): Promise<boolean> {
  return userCanViewPipelineDeal(userId, pipelineDealId);
}

export async function userCanMutateCapitalData(userId: string, pipelineDealId: string): Promise<boolean> {
  return userCanViewPipelineDeal(userId, pipelineDealId);
}

export async function userCanSelectOfferAndFinalize(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u ? userCanElevatedCapitalOps(u.role) : false;
}

export async function userCanWaiveCriticalFinancingCondition(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u) return false;
  return u.role === PlatformRole.ADMIN || u.role === PlatformRole.BROKER;
}
