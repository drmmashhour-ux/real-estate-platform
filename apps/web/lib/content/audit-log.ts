import { prisma } from "@/lib/db";

export async function logGeneratedContentAudit(input: {
  contentId: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: string | null;
  actorSystem?: boolean;
  snapshot?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.lecipmGeneratedContentAuditLog.create({
    data: {
      contentId: input.contentId,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId,
      actorSystem: input.actorSystem ?? false,
      snapshot: input.snapshot as object | undefined,
      payload: input.payload as object | undefined,
    },
  });
}
