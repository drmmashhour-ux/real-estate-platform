import { prisma } from "@/lib/db";
import { marketplaceAiV5Flags } from "@/config/feature-flags";
import type { MarketplaceAgentKind } from "./agent.types";

export type AgentMemoryState = {
  preferences: string[];
  lastOutcomes: Array<{ label: string; at: string }>;
  notes: Record<string, unknown>;
};

const emptyMemory = (): AgentMemoryState => ({
  preferences: [],
  lastOutcomes: [],
  notes: {},
});

export async function getAgentMemory(
  agentKind: MarketplaceAgentKind,
  subjectType: string,
  subjectId: string,
): Promise<AgentMemoryState> {
  if (!marketplaceAiV5Flags.agentSystemV1) return emptyMemory();

  const row = await prisma.marketplaceAgentV5Memory.findUnique({
    where: {
      agentKind_subjectType_subjectId: { agentKind, subjectType, subjectId },
    },
  });
  if (!row?.memoryJson || typeof row.memoryJson !== "object") return emptyMemory();
  const m = row.memoryJson as Record<string, unknown>;
  return {
    preferences: Array.isArray(m.preferences) ? (m.preferences as string[]).filter((x) => typeof x === "string") : [],
    lastOutcomes: Array.isArray(m.lastOutcomes) ? (m.lastOutcomes as AgentMemoryState["lastOutcomes"]) : [],
    notes: typeof m.notes === "object" && m.notes ? (m.notes as Record<string, unknown>) : {},
  };
}

export async function mergeAgentMemory(
  agentKind: MarketplaceAgentKind,
  subjectType: string,
  subjectId: string,
  patch: Partial<AgentMemoryState>,
): Promise<void> {
  if (!marketplaceAiV5Flags.agentSystemV1) return;

  const cur = await getAgentMemory(agentKind, subjectType, subjectId);
  const next: AgentMemoryState = {
    preferences: [...new Set([...cur.preferences, ...(patch.preferences ?? [])])].slice(0, 40),
    lastOutcomes: [...(patch.lastOutcomes ?? []), ...cur.lastOutcomes].slice(0, 30),
    notes: { ...cur.notes, ...patch.notes },
  };

  await prisma.marketplaceAgentV5Memory.upsert({
    where: {
      agentKind_subjectType_subjectId: { agentKind, subjectType, subjectId },
    },
    create: {
      agentKind,
      subjectType,
      subjectId,
      memoryJson: next as object,
    },
    update: { memoryJson: next as object },
  });
}
