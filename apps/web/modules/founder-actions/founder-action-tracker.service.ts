import { prisma } from "@/lib/db";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { executiveScopeToStored, storedScopeMatchesSession } from "../founder-intelligence/founder-scope";
import type { CreateFounderActionInput, PatchFounderActionInput } from "./founder-actions.types";

export async function createFounderAction(
  userId: string,
  scope: ExecutiveScope,
  input: CreateFounderActionInput,
) {
  const { scopeKind, scopeOfficeIdsJson } = executiveScopeToStored(scope);
  return prisma.founderAction.create({
    data: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      summary: input.summary,
      priority: input.priority ?? "medium",
      createdByUserId: userId,
      scopeKind,
      scopeOfficeIdsJson: scopeOfficeIdsJson as object,
    },
  });
}

export async function listFounderActionsForScope(scope: ExecutiveScope, userId: string, take = 50) {
  const rows = await prisma.founderAction.findMany({
    where: { createdByUserId: userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return rows.filter((r) => storedScopeMatchesSession(scope, r.scopeKind, r.scopeOfficeIdsJson)).slice(0, take);
}

export async function patchFounderAction(
  id: string,
  scope: ExecutiveScope,
  userId: string,
  patch: PatchFounderActionInput,
) {
  const existing = await prisma.founderAction.findFirst({ where: { id, createdByUserId: userId } });
  if (!existing) return null;
  if (!storedScopeMatchesSession(scope, existing.scopeKind, existing.scopeOfficeIdsJson)) return null;
  return prisma.founderAction.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.assignedToUserId !== undefined ? { assignedToUserId: patch.assignedToUserId } : {}),
      ...(patch.priority ? { priority: patch.priority } : {}),
    },
  });
}
