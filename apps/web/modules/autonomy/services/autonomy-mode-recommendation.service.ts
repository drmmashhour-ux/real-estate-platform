import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export type AutonomyMode = 
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type ModeRecommendation = {
  suggestedMode: AutonomyMode;
  reason: string;
  confidence: number;
  factors: {
    label: string;
    value: string | number;
    impact: "positive" | "negative" | "neutral";
  }[];
};

export async function getAutonomyModeRecommendation(): Promise<ModeRecommendation> {
  const windowDays = 7;
  const recentThreshold = subDays(new Date(), windowDays);

  // 1. Fetch recent decision outcomes
  const recentActions = await prisma.autonomousActionQueue.findMany({
    where: {
      createdAt: { gte: recentThreshold },
    },
    select: {
      status: true,
      riskLevel: true,
      requiresApproval: true,
    },
  });

  const totalActions = recentActions.length;
  const failures = recentActions.filter(a => a.status === "BLOCKED").length;
  const highRisk = recentActions.filter(a => a.riskLevel === "HIGH").length;
  const approvalRate = recentActions.filter(a => a.requiresApproval).length / (totalActions || 1);
  const failureRate = failures / (totalActions || 1);

  // 2. Evaluate current governance state
  const govState = await prisma.managerAiAutonomyGovernanceState.findUnique({
    where: { id: "singleton" },
  });

  // 3. Logic for recommendation
  let suggestedMode: AutonomyMode = "ASSIST";
  let reason = "Maintaining assisted mode while collecting more operational data.";
  let confidence = 0.8;
  const factors: ModeRecommendation["factors"] = [];

  factors.push({
    label: "Recent Decisions",
    value: totalActions,
    impact: totalActions > 10 ? "positive" : "neutral",
  });

  factors.push({
    label: "System Block Rate",
    value: `${(failureRate * 100).toFixed(1)}%`,
    impact: failureRate < 0.05 ? "positive" : failureRate < 0.15 ? "neutral" : "negative",
  });

  factors.push({
    label: "High Risk Density",
    value: `${((highRisk / (totalActions || 1)) * 100).toFixed(1)}%`,
    impact: highRisk < (totalActions * 0.1) ? "positive" : "negative",
  });

  if (failureRate > 0.2) {
    suggestedMode = "OFF";
    reason = "High system block rate detected. Recommend manual override until policy alignment improves.";
  } else if (failureRate < 0.05 && totalActions > 20 && highRisk < totalActions * 0.05) {
    suggestedMode = "SAFE_AUTOPILOT";
    reason = "High reliability and low risk density observed. Safe to elevate to autopilot for non-critical domains.";
  } else if (failureRate < 0.1 && approvalRate > 0.5) {
    suggestedMode = "FULL_AUTOPILOT_APPROVAL";
    reason = "Solid performance with human-in-the-loop. Recommend autopilot with mandatory approvals.";
  }

  return {
    suggestedMode,
    reason,
    confidence,
    factors,
  };
}
