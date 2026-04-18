/**
 * Merge broker closing state into Lead.aiExplanation (additive; preserves other keys).
 */

import type { LeadClosingStage, PersistedBrokerClosingV1 } from "./broker-closing.types";

export function parseBrokerClosingV1(aiExplanation: unknown): PersistedBrokerClosingV1 | null {
  if (!aiExplanation || typeof aiExplanation !== "object") return null;
  const o = aiExplanation as Record<string, unknown>;
  const b = o.brokerClosingV1;
  if (!b || typeof b !== "object") return null;
  const x = b as Record<string, unknown>;
  if (x.version !== 1) return null;
  if (typeof x.stage !== "string") return null;
  if (typeof x.responseReceived !== "boolean") return null;
  if (typeof x.createdAt !== "string" || typeof x.updatedAt !== "string") return null;
  return b as PersistedBrokerClosingV1;
}

export function mergeBrokerClosingIntoAiExplanation(
  aiExplanation: unknown,
  patch: Partial<PersistedBrokerClosingV1> & { stage?: LeadClosingStage },
): Record<string, unknown> {
  const base =
    aiExplanation && typeof aiExplanation === "object" ? { ...(aiExplanation as Record<string, unknown>) } : {};
  const now = new Date().toISOString();
  const prev = parseBrokerClosingV1(base) ?? {
    version: 1 as const,
    stage: "new" as LeadClosingStage,
    responseReceived: false,
    createdAt: now,
    updatedAt: now,
  };
  const next: PersistedBrokerClosingV1 = {
    ...prev,
    ...patch,
    version: 1,
    updatedAt: now,
    createdAt: prev.createdAt,
  };
  return { ...base, brokerClosingV1: next };
}
