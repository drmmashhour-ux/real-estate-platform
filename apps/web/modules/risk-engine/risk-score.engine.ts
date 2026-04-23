import type { LecipmPreDisputeRiskLevel } from "@prisma/client";

import type { RiskAssessmentResult, RiskSignal } from "./risk.types";

function dedupeSignals(signals: RiskSignal[]): RiskSignal[] {
  const byId = new Map<string, RiskSignal>();
  for (const s of signals) {
    const prev = byId.get(s.id);
    if (!prev || prev.weight < s.weight) byId.set(s.id, s);
  }
  return [...byId.values()].sort((a, b) => b.weight - a.weight);
}

/**
 * Deterministic scoring (0–100) + banded levels. Explains **risk of friction / escalation**, not fault.
 */
export function computeRiskAssessment(signals: RiskSignal[]): RiskAssessmentResult {
  const merged = dedupeSignals(signals);
  const weak = merged.filter((s) => s.weight < 14);
  let raw = merged.reduce((acc, s) => acc + s.weight, 0);
  if (weak.length >= 3) raw += 18;
  raw = Math.min(100, Math.round(raw));

  const hasComplianceCritical = merged.some((s) => s.id === "compliance_critical_failure");
  const maxSingle = merged.reduce((m, s) => Math.max(m, s.weight), 0);

  let riskLevel: LecipmPreDisputeRiskLevel;
  if (hasComplianceCritical || raw >= 90) {
    riskLevel = "CRITICAL";
  } else if (raw >= 72 || maxSingle >= 38) {
    riskLevel = "HIGH";
  } else if (raw >= 42 || merged.length >= 4 || weak.length >= 3) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  const explainLines = buildExplainLines(merged, raw, riskLevel);

  return {
    riskScore: raw,
    riskLevel,
    explainLines,
    signals: merged,
  };
}

function buildExplainLines(
  signals: RiskSignal[],
  score: number,
  level: LecipmPreDisputeRiskLevel
): string[] {
  const lines: string[] = [];
  lines.push(`Aggregate risk score ${score}/100 (${level}) — directional signal only, not a legal outcome.`);
  for (const s of signals.slice(0, 8)) {
    lines.push(`• ${humanSignalTitle(s.id)}: ${s.evidence}`);
  }
  if (signals.length > 8) {
    lines.push(`• …and ${signals.length - 8} more signal(s) omitted for brevity.`);
  }
  return lines;
}

function humanSignalTitle(id: string): string {
  const map: Record<string, string> = {
    booking_no_confirmation: "Confirmation / comms gap",
    repeated_reschedule: "Schedule churn",
    high_message_friction: "Messaging friction",
    compliance_missing_docs: "Compliance readiness gap",
    compliance_critical_failure: "Compliance critical flag",
    payment_delay: "Payment timing tension",
    negotiation_stall: "Negotiation idle",
    assistant_rejection_friction: "Assistant follow-up friction",
    autopilot_execution_friction: "Autopilot execution friction",
    repeated_issue_pattern: "Repeated operational issues",
    negative_feedback_tension: "Negative feedback tension",
    listing_readiness_gap: "Listing readiness",
    trust_safety_flag: "Trust / safety flag",
  };
  return map[id] ?? id;
}
