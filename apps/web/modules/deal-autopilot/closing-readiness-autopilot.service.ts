import { dealAutopilotFlags } from "@/config/feature-flags";
import type { ClosingReadiness } from "./deal-autopilot.types";

type Inputs = {
  blockerCount: number;
  overdueCount: number;
  openCompliance: number;
  pendingConditions: number;
  notaryOk: boolean;
};

export function computeClosingReadiness(input: Inputs): ClosingReadiness {
  if (!dealAutopilotFlags.closingReadinessAutopilotV1) {
    return {
      score: 0,
      label: "Closing readiness autopilot disabled",
      checklist: [{ key: "flag", ok: false, note: "Enable FEATURE_CLOSING_READINESS_AUTOPILOT_V1" }],
    };
  }

  let score = 85;
  score -= input.blockerCount * 8;
  score -= input.overdueCount * 10;
  score -= input.openCompliance * 12;
  score -= input.pendingConditions * 5;
  if (!input.notaryOk) score -= 15;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const checklist: ClosingReadiness["checklist"] = [
    { key: "blockers", ok: input.blockerCount === 0, note: input.blockerCount ? `${input.blockerCount} blockers` : undefined },
    { key: "overdue", ok: input.overdueCount === 0, note: input.overdueCount ? `${input.overdueCount} overdue` : undefined },
    { key: "compliance", ok: input.openCompliance === 0, note: input.openCompliance ? "Open compliance cases" : undefined },
    { key: "conditions", ok: input.pendingConditions === 0, note: input.pendingConditions ? "Pending conditions" : undefined },
    { key: "notary", ok: input.notaryOk, note: input.notaryOk ? undefined : "Notary coordination not clear" },
  ];

  const label =
    score >= 75 ? "On track" : score >= 50 ? "Needs attention" : score >= 25 ? "At risk" : "Not ready";

  return { score, label, checklist };
}
