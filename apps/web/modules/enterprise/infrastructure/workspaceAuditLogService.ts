import type { Prisma, PrismaClient } from "@prisma/client";

export type WorkspaceAuditAction =
  | "member_invited"
  | "member_role_changed"
  | "listing_updated"
  | "trustgraph_run"
  | "deal_analysis_run"
  | "billing_change"
  | "workspace_setting_change"
  | "compliance_action";

export async function appendWorkspaceAuditLog(
  db: PrismaClient | Prisma.TransactionClient,
  args: {
    workspaceId: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await db.workspaceAuditLog.create({
    data: {
      workspaceId: args.workspaceId,
      actorUserId: args.actorUserId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId ?? null,
      metadata: (args.metadata ?? {}) as object,
    },
  });
}
