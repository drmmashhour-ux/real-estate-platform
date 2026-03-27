import { prisma } from "@/lib/db";

/** Open verification cases tied to workspace via assignments or entity links (LISTING). */
export async function countOpenWorkspaceCases(workspaceId: string): Promise<number> {
  const listingIds = await prisma.trustgraphComplianceWorkspaceEntityLink.findMany({
    where: { workspaceId, entityType: "LISTING" },
    select: { entityId: true },
  });
  const ids = listingIds.map((l) => l.entityId);
  if (ids.length === 0) {
    const assigned = await prisma.trustgraphWorkspaceCaseAssignment.count({
      where: { workspaceId },
    });
    return assigned;
  }
  return prisma.verificationCase.count({
    where: {
      entityType: "LISTING",
      entityId: { in: ids },
      status: { in: ["pending", "in_review"] },
    },
  });
}
