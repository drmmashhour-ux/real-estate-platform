import { AiAutopilotActionStatus, AiSuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminAiOverview = {
  pendingSuggestions: number;
  pendingActions: number;
  failedActions24h: number;
  recentSuggestions: { id: string; title: string; type: string; hostId: string | null; createdAt: Date }[];
  recentActions: {
    id: string;
    actionType: string;
    status: string;
    hostId: string | null;
    listingId: string | null;
    createdAt: Date;
  }[];
};

export async function getAdminAiOverview(): Promise<AdminAiOverview> {
  const since = new Date(Date.now() - 24 * 3600000);
  const [pendingSuggestions, pendingActions, failedActions24h, recentSuggestions, recentActions] =
    await Promise.all([
      prisma.aiSuggestion.count({ where: { status: AiSuggestionStatus.PENDING } }),
      prisma.aiAutopilotAction.count({ where: { status: AiAutopilotActionStatus.PENDING } }),
      prisma.aiAutopilotAction.count({
        where: { status: AiAutopilotActionStatus.FAILED, createdAt: { gte: since } },
      }),
      prisma.aiSuggestion.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, title: true, type: true, hostId: true, createdAt: true },
      }),
      prisma.aiAutopilotAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          actionType: true,
          status: true,
          hostId: true,
          listingId: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    pendingSuggestions,
    pendingActions,
    failedActions24h,
    recentSuggestions,
    recentActions,
  };
}
