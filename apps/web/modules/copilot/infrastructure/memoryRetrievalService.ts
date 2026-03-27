import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 12;

/**
 * Read recent Copilot memory rows for grounding (deterministic snippets only).
 */
export async function retrieveCopilotMemoryForContext(args: {
  userId: string;
  workspaceId?: string | null;
  memoryTypes?: string[];
  limit?: number;
}) {
  const take = args.limit ?? DEFAULT_LIMIT;
  return prisma.copilotMemoryItem.findMany({
    where: {
      userId: args.userId,
      ...(args.workspaceId ? { workspaceId: args.workspaceId } : {}),
      ...(args.memoryTypes?.length ? { memoryType: { in: args.memoryTypes } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      memoryType: true,
      key: true,
      content: true,
      metadata: true,
      updatedAt: true,
    },
  });
}
