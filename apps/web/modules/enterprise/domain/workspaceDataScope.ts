import { LecipmWorkspaceRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/** Strict workspace scope for deals (brokers only see rows they own). */
export function workspaceDealWhere(
  workspaceId: string,
  role: LecipmWorkspaceRole,
  userId: string
): Prisma.DealWhereInput {
  const scope: Prisma.DealWhereInput = { workspaceId };
  if (role === LecipmWorkspaceRole.broker) {
    return { AND: [scope, { brokerId: userId }] };
  }
  return scope;
}

/** Leads attributed to workspace; brokers see only introductions they own. */
export function workspaceLeadWhere(
  workspaceId: string,
  role: LecipmWorkspaceRole,
  userId: string
): Prisma.LeadWhereInput {
  const scope: Prisma.LeadWhereInput = { workspaceId };
  if (role === LecipmWorkspaceRole.broker) {
    return { AND: [scope, { introducedByBrokerId: userId }] };
  }
  return scope;
}

export function workspaceDocumentWhere(
  workspaceId: string,
  role: LecipmWorkspaceRole,
  userId: string
): Prisma.DocumentFileWhereInput {
  const scope: Prisma.DocumentFileWhereInput = { workspaceId };
  if (role === LecipmWorkspaceRole.broker) {
    return { AND: [scope, { uploadedById: userId }] };
  }
  return scope;
}

export function workspaceAiActionWhere(
  workspaceId: string,
  role: LecipmWorkspaceRole,
  userId: string
): Prisma.LecipmAiOperatorActionWhereInput {
  const scope: Prisma.LecipmAiOperatorActionWhereInput = { workspaceId };
  if (role === LecipmWorkspaceRole.broker) {
    return { AND: [scope, { userId }] };
  }
  return scope;
}
