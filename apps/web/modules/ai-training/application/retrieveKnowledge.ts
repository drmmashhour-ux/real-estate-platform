import type { PrismaClient, Prisma } from "@prisma/client";
import type { KnowledgeFilter } from "../domain/types";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3)
    .slice(0, 8);
}

export async function retrieveKnowledge(db: PrismaClient, filter: KnowledgeFilter) {
  const take = Math.min(40, Math.max(1, filter.limit ?? 10));
  const tokens = filter.query ? tokenize(filter.query) : [];

  const where: Prisma.CopilotMemoryItemWhereInput = {
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.workspaceId ? { workspaceId: filter.workspaceId } : {}),
    ...(filter.listingId ? { listingId: filter.listingId } : {}),
    ...(filter.city ? { city: { equals: filter.city, mode: "insensitive" } } : {}),
    ...(filter.propertyType ? { propertyType: { equals: filter.propertyType, mode: "insensitive" } } : {}),
    ...(filter.memoryTypes?.length ? { memoryType: { in: filter.memoryTypes } } : {}),
    ...(tokens.length
      ? {
          OR: tokens.map((t) => ({
            content: { contains: t, mode: "insensitive" },
          })),
        }
      : {}),
  };

  return db.copilotMemoryItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      memoryType: true,
      key: true,
      listingId: true,
      city: true,
      propertyType: true,
      content: true,
      metadata: true,
      updatedAt: true,
    },
  });
}
