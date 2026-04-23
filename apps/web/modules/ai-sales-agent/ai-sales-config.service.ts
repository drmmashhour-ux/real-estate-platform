import { prisma } from "@/lib/db";

import type { AiSalesMode } from "./ai-sales.types";

const VALID: AiSalesMode[] = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT"];

function normalizeMode(raw: string | undefined | null): AiSalesMode {
  const u = String(raw ?? "").trim().toUpperCase();
  if (u === "SAFE_AUTOPILOT" || u === "SAFE") return "SAFE_AUTOPILOT";
  if (u === "FULL_AUTOPILOT" || u === "FULL") return "FULL_AUTOPILOT";
  if (u === "ASSIST") return "ASSIST";
  if (u === "OFF") return "OFF";
  return "SAFE_AUTOPILOT";
}

export type AiSalesAgentConfig = {
  mode: AiSalesMode;
  /** Prefer AI sales multi-day sequence over legacy Centris domination jobs (single owner of touchpoints). */
  ownSequence: boolean;
};

/**
 * Reads `AiFollowUpSettings.templatesJson.aiSalesAgent` + env `AI_SALES_AGENT_MODE`.
 * Default mode: SAFE_AUTOPILOT (assistant-led, broker-in-the-loop escalations).
 */
export async function getAiSalesAgentConfig(): Promise<AiSalesAgentConfig> {
  const row = await prisma.aiFollowUpSettings.findUnique({ where: { id: "global" } });
  const tj = (row?.templatesJson as Record<string, unknown> | null) ?? {};
  const block = (tj.aiSalesAgent as Record<string, unknown> | undefined) ?? {};
  const envMode = process.env.AI_SALES_AGENT_MODE;
  const mode = normalizeMode(
    typeof block.mode === "string" ? block.mode : typeof envMode === "string" ? envMode : null,
  );
  const ownSequence =
    typeof block.ownSequence === "boolean"
      ? block.ownSequence
      : process.env.AI_SALES_AGENT_OWNS_SEQUENCE !== "false";

  return { mode, ownSequence };
}

export function isAutopilot(mode: AiSalesMode): boolean {
  return mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT";
}

export function modeAllowsOutboundEmail(mode: AiSalesMode): boolean {
  return mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT";
}

export function modeAllowsSms(mode: AiSalesMode): boolean {
  return mode === "FULL_AUTOPILOT";
}
