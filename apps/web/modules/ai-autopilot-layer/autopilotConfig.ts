import { prisma } from "@/lib/db";
import type { AutopilotLayerMode } from "./types";
import { AUTOPILOT_MODES } from "./types";

function normalizeMode(m: string): AutopilotLayerMode {
  const u = m.toUpperCase();
  if (AUTOPILOT_MODES.includes(u as AutopilotLayerMode)) return u as AutopilotLayerMode;
  return "ASSIST";
}

export async function getAutopilotLayerConfig(userId: string) {
  return prisma.aiAutopilotLayerConfig.findUnique({ where: { userId } });
}

export async function getOrCreateAutopilotLayerConfig(userId: string) {
  const existing = await getAutopilotLayerConfig(userId);
  if (existing) return existing;
  return prisma.aiAutopilotLayerConfig.create({
    data: { userId, mode: "ASSIST" },
  });
}

export async function upsertAutopilotLayerConfig(
  userId: string,
  data: Partial<{
    mode: string;
    autoDrafting: boolean;
    autoReview: boolean;
    autoSuggestions: boolean;
    autoBrokerRoute: boolean;
    autoPricing: boolean;
    paused: boolean;
  }>
) {
  const mode = data.mode != null ? normalizeMode(data.mode) : undefined;
  return prisma.aiAutopilotLayerConfig.upsert({
    where: { userId },
    create: {
      userId,
      mode: mode ?? "ASSIST",
      autoDrafting: data.autoDrafting ?? true,
      autoReview: data.autoReview ?? true,
      autoSuggestions: data.autoSuggestions ?? true,
      autoBrokerRoute: data.autoBrokerRoute ?? false,
      autoPricing: data.autoPricing ?? false,
      paused: data.paused ?? false,
    },
    update: {
      ...(mode != null ? { mode } : {}),
      ...(data.autoDrafting != null ? { autoDrafting: data.autoDrafting } : {}),
      ...(data.autoReview != null ? { autoReview: data.autoReview } : {}),
      ...(data.autoSuggestions != null ? { autoSuggestions: data.autoSuggestions } : {}),
      ...(data.autoBrokerRoute != null ? { autoBrokerRoute: data.autoBrokerRoute } : {}),
      ...(data.autoPricing != null ? { autoPricing: data.autoPricing } : {}),
      ...(data.paused != null ? { paused: data.paused } : {}),
    },
  });
}
