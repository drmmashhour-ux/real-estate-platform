import type { FraudActionType, FraudRiskLevel } from "@prisma/client";
import { clampScore } from "@/lib/fraud/validators";

export function scoreToRiskLevel(score: number): FraudRiskLevel {
  const s = clampScore(score);
  if (s < 30) return "low";
  if (s < 55) return "medium";
  if (s < 80) return "high";
  return "critical";
}

export function recommendActionFromScore(score: number): FraudActionType {
  const s = clampScore(score);
  if (s < 22) return "allow";
  if (s < 45) return "monitor";
  if (s < 70) return "review";
  if (s < 88) return "challenge";
  return "block";
}
