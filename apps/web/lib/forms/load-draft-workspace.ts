import { prisma } from "@/lib/db";

const include = {
  template: true,
  suggestions: { orderBy: { createdAt: "desc" as const }, take: 100 },
  alerts: { orderBy: { createdAt: "desc" as const } },
  auditEvents: { orderBy: { createdAt: "desc" as const }, take: 50 },
} as const;

export type LegalDraftWorkspacePayload = NonNullable<
  Awaited<ReturnType<typeof loadLegalDraftWorkspace>>
>;

export async function loadLegalDraftWorkspace(
  draftId: string,
  userId: string,
  role: string
) {
  const where =
    role === "ADMIN"
      ? { id: draftId }
      : {
          id: draftId,
          brokerUserId: userId,
        };

  return prisma.legalFormDraft.findFirst({
    where,
    include,
  });
}
