/**
 * Deterministic lead signals from CRM closing state — no fabricated probabilities.
 */

import { computeIdleHours } from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingStage, LeadClosingState } from "@/modules/broker/closing/broker-closing.types";
import type { BrokerAiLeadSignal, BrokerAiLeadSignalType } from "./broker-ai-assist.types";

function terminal(stage: LeadClosingStage): boolean {
  return stage === "closed_won" || stage === "closed_lost";
}

function severityForIdle(idleH: number | null): "info" | "low" | "medium" | "high" {
  if (idleH == null) return "low";
  if (idleH >= 168) return "high";
  if (idleH >= 96) return "medium";
  if (idleH >= 48) return "low";
  return "info";
}

export type LeadSignalInput = {
  leadId: string;
  closing: LeadClosingState;
  score: number;
  nowMs: number;
};

/** Stable ordering: severity rank desc, then signalType string */
const SEVERITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, info: 0 };

export function buildBrokerAiLeadSignals(input: LeadSignalInput): BrokerAiLeadSignal[] {
  const { leadId, closing, score, nowMs } = input;
  const stage = closing.stage;
  const idleH = computeIdleHours(closing, nowMs);
  const out: BrokerAiLeadSignal[] = [];

  if (stage === "closed_won") {
    out.push({
      leadId,
      signalType: "strong_progress",
      label: "Outcome logged",
      description: "This lead is marked won in CRM — focus on learning and replication, not pipeline nudges.",
      severity: "info",
    });
    return out.slice(0, 4);
  }

  if (stage === "closed_lost") {
    out.push({
      leadId,
      signalType: "strong_progress",
      label: "Pipeline closed",
      description: "Marked lost — review notes for patterns; no routine progression signal applies.",
      severity: "info",
    });
    return out.slice(0, 4);
  }

  if (idleH != null && idleH >= 96 && !terminal(stage)) {
    out.push({
      leadId,
      signalType: "cooling_down",
      label: "Cooling momentum",
      description: "Idle time since last contact is high — consider a concise check-in or intentional archive.",
      severity: severityForIdle(idleH),
    });
  }

  if (stage === "contacted" && !closing.responseReceived && idleH != null && idleH >= 48) {
    out.push({
      leadId,
      signalType: "no_response_risk",
      label: "No reply signal yet",
      description: "Contact logged without a clear reply signal — follow-up cadence matters.",
      severity: idleH >= 72 ? "medium" : "low",
    });
    out.push({
      leadId,
      signalType: "stalled_after_contact",
      label: "Stalled after contact",
      description: "Pipeline still at contacted — clarify next step or timing with the client.",
      severity: idleH >= 72 ? "medium" : "low",
    });
  }

  if (
    score >= 70 &&
    (stage === "responded" || stage === "meeting_scheduled" || stage === "negotiation")
  ) {
    out.push({
      leadId,
      signalType: "hot_lead",
      label: "Strong fit signal",
      description: "Score and stage suggest momentum — good moment to propose a concrete next step.",
      severity: "low",
    });
  }

  if (stage === "responded" && idleH != null && idleH < 96) {
    out.push({
      leadId,
      signalType: "ready_for_meeting",
      label: "Ready to advance",
      description: "Reply signal present — natural window to propose times or a short agenda.",
      severity: "info",
    });
  }

  if (stage === "meeting_scheduled" || stage === "negotiation") {
    out.push({
      leadId,
      signalType: "strong_progress",
      label: "Deep pipeline",
      description: "Active deal discussion — summarize decisions and confirm next actions after each touch.",
      severity: "info",
    });
  }

  const dedup = new Map<BrokerAiLeadSignalType, BrokerAiLeadSignal>();
  for (const s of out) {
    if (!dedup.has(s.signalType)) dedup.set(s.signalType, s);
  }
  const merged = [...dedup.values()];
  merged.sort((a, b) => {
    const dr = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (dr !== 0) return dr;
    return a.signalType.localeCompare(b.signalType);
  });

  return merged.slice(0, 4);
}
