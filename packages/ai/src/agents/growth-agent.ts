/**
 * Growth agent — recommendations from real operational signals (no invented metrics).
 */
import type { AgentRunInput, AgentObservation, LecipmAgentContract } from "./agent-runtime";
import { prisma } from "@/lib/db";

const KEY = "growth" as const;

async function observe(input: AgentRunInput): Promise<AgentObservation> {
  const tags: string[] = [];
  const listingCount = await prisma.shortTermListing.count({ where: { ownerId: input.userId } });
  if (listingCount === 0 && input.role === "HOST") tags.push("no_listings");
  return {
    summary: "Growth scan from database state only.",
    signals: { tags, listingCount, role: input.role },
  };
}

async function diagnose(obs: AgentObservation): Promise<{ issues: string[] }> {
  const tags = obs.signals.tags;
  const issues: string[] = [];
  if (Array.isArray(tags) && tags.includes("no_listings")) issues.push("host_has_no_listings");
  return { issues };
}

export const growthAgent: LecipmAgentContract = {
  key: KEY,
  observe,
  diagnose,
  async plan(issues) {
    return issues.map((id, i) => ({
      id: `step-${i}`,
      toolKey: "create_recommendation_row",
      description: id,
    }));
  },
  async proposeActions(steps) {
    return steps.map((s) => ({
      actionKey: "create_in_app_task",
      label: s.description,
      requiresApproval: false,
      payload: { step: s.id },
    }));
  },
  async executeAllowedActions() {
    return { ok: true, results: [] };
  },
  async summarizeOutcome(proposals) {
    return {
      summary: `Queued ${proposals.length} internal growth hints (no outbound sends).`,
      confidence: 0.55,
      executedKeys: [],
      blockedKeys: [],
    };
  },
};
