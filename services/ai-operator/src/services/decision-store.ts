import type { AiOperatorDecision, AgentType, HumanOverride } from "../models/decisions.js";

const decisions: AiOperatorDecision[] = [];
let idCounter = 0;

function nextId(): string {
  return `dec_${Date.now()}_${++idCounter}`;
}

export function logDecision(decision: Omit<AiOperatorDecision, "id" | "createdAt">): AiOperatorDecision {
  const record: AiOperatorDecision = {
    ...decision,
    id: nextId(),
    createdAt: new Date().toISOString(),
  };
  decisions.push(record);
  return record;
}

export function getDecisions(options: {
  agentType?: AgentType;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}): AiOperatorDecision[] {
  let out = [...decisions];
  if (options.agentType) out = out.filter((d) => d.agentType === options.agentType);
  if (options.entityType) out = out.filter((d) => d.entityType === options.entityType);
  if (options.entityId) out = out.filter((d) => d.entityId === options.entityId);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return out.slice(offset, offset + limit);
}

export function applyHumanOverride(
  decisionId: string,
  override: HumanOverride
): AiOperatorDecision | null {
  const idx = decisions.findIndex((d) => d.id === decisionId);
  if (idx === -1) return null;
  decisions[idx] = {
    ...decisions[idx],
    humanOverride: override,
    outputSummary: {
      ...decisions[idx].outputSummary,
      overriddenAction: override.newAction,
      overrideNotes: override.notes,
    },
  };
  return decisions[idx];
}

export function getDecisionById(id: string): AiOperatorDecision | null {
  return decisions.find((d) => d.id === id) ?? null;
}
