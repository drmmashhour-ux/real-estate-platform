import { prisma } from "@/lib/db";

export async function getGlobalAutopilotPause(): Promise<{
  paused: boolean;
  pausedById: string | null;
  reason: string | null;
}> {
  const row = await prisma.lecipmFullAutopilotGlobalState.findUnique({
    where: { id: "singleton" },
  });
  return {
    paused: row?.pausedAll ?? false,
    pausedById: row?.pausedById ?? null,
    reason: row?.pausedReason ?? null,
  };
}

export async function setGlobalAutopilotPause(params: {
  paused: boolean;
  actorUserId: string;
  reason: string;
}): Promise<void> {
  await prisma.lecipmFullAutopilotGlobalState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      pausedAll: params.paused,
      pausedById: params.actorUserId,
      pausedReason: params.reason.slice(0, 8000),
    },
    update: {
      pausedAll: params.paused,
      pausedById: params.actorUserId,
      pausedReason: params.reason.slice(0, 8000),
    },
  });
}
