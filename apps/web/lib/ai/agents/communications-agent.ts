/**
 * Communications agent — drafts and policy-gated nudges only.
 */
import { queueTemplateCommunication } from "@/lib/ai/actions/communications-engine";
import type { AgentRunInput, AgentObservation, LecipmAgentContract } from "./agent-runtime";

const KEY = "communications" as const;

export const communicationsAgent: LecipmAgentContract = {
  key: KEY,
  async observe(input: AgentRunInput): Promise<AgentObservation> {
    return {
      summary: "Communications context",
      signals: { listingId: input.listingId ?? null, bookingId: input.bookingId ?? null },
    };
  },
  async diagnose(obs) {
    const issues: string[] = [];
    if (obs.signals.bookingId) issues.push("booking_thread");
    return { issues };
  },
  async plan(issues) {
    return issues.map((id, i) => ({ id: `c-${i}`, toolKey: "communications_template", description: id }));
  },
  async proposeActions(steps) {
    return steps.map((s) => ({
      actionKey: "draft_message",
      label: s.description,
      requiresApproval: true,
      payload: {},
    }));
  },
  async executeAllowedActions(proposals, input) {
    const results: unknown[] = [];
    for (const p of proposals) {
      const r = await queueTemplateCommunication({
        userId: input.userId,
        templateFamily: "operational_nudge",
        title: p.label,
        body: "Open the app for details — this is a logged draft surface only.",
        metadata: { actionKey: p.actionKey },
      });
      results.push(r);
    }
    return { ok: true, results };
  },
  async summarizeOutcome(proposals, results) {
    return {
      summary: `Logged ${results.length} communication queue entries from ${proposals.length} proposals.`,
      confidence: 0.6,
      executedKeys: proposals.map((p) => p.actionKey),
      blockedKeys: [],
    };
  },
};
