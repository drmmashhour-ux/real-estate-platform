/**
 * Dashboard-sized prioritization lines — complements Top 3; deterministic ordering.
 */

import { computeIdleHours } from "@/modules/broker/closing/broker-next-action.service";
import type { BrokerNextBestAction } from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingStage, LeadClosingState } from "@/modules/broker/closing/broker-closing.types";
import { recordDailyAssistBuilt } from "./broker-ai-assist-monitoring.service";
import type { BrokerAiDailyAssist } from "./broker-ai-assist.types";

function terminal(stage: LeadClosingStage): boolean {
  return stage === "closed_won" || stage === "closed_lost";
}

export type DailyAssistRow = {
  leadId: string;
  name: string;
  score: number;
  closing: LeadClosingState;
  nextAction: BrokerNextBestAction;
};

function shortName(name: string, leadId: string): string {
  const t = name.trim();
  if (t.length > 0) return t.length > 32 ? `${t.slice(0, 29)}…` : t;
  return leadId.slice(0, 8);
}

export function buildBrokerAiDailyAssist(rows: DailyAssistRow[], nowMs: number): BrokerAiDailyAssist {
  const open = rows.filter((r) => !terminal(r.closing.stage));

  const followUpNow = open
    .filter((r) => {
      const idle = computeIdleHours(r.closing, nowMs);
      return (
        r.closing.stage === "contacted" &&
        !r.closing.responseReceived &&
        idle != null &&
        idle >= 48
      );
    })
    .sort((a, b) => {
      const ia = computeIdleHours(a.closing, nowMs) ?? 0;
      const ib = computeIdleHours(b.closing, nowMs) ?? 0;
      return ib - ia;
    })
    .slice(0, 8)
    .map((r) => ({ leadId: r.leadId, name: shortName(r.name, r.leadId) }));

  const stallRisk = open
    .filter((r) => {
      const idle = computeIdleHours(r.closing, nowMs);
      return r.closing.stage === "contacted" && !r.closing.responseReceived && idle != null && idle >= 72;
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.leadId.localeCompare(b.leadId)))
    .slice(0, 8)
    .map((r) => ({ leadId: r.leadId, name: shortName(r.name, r.leadId) }));

  const opportunities = open
    .filter(
      (r) =>
        r.score >= 70 &&
        (r.closing.stage === "responded" ||
          r.closing.stage === "meeting_scheduled" ||
          r.closing.stage === "negotiation"),
    )
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.leadId.localeCompare(b.leadId)))
    .slice(0, 8)
    .map((r) => ({ leadId: r.leadId, name: shortName(r.name, r.leadId) }));

  const lines: string[] = [];
  if (followUpNow.length > 0) {
    lines.push(`${followUpNow.length} lead(s) match an overdue follow-up pattern — good candidates to touch first.`);
  }
  if (stallRisk.length > 0) {
    lines.push(`${stallRisk.length} lead(s) look most likely to stall without a timely nudge.`);
  }
  if (opportunities.length > 0) {
    lines.push(`${opportunities.length} lead(s) show stronger score + progression — good day to propose next steps.`);
  }
  if (lines.length === 0) {
    lines.push(
      "No priority patterns matched in the current sample — keep your usual daily pass through new leads.",
    );
  }

  recordDailyAssistBuilt();

  return {
    followUpNow,
    stallRisk,
    opportunities,
    lines,
  };
}
