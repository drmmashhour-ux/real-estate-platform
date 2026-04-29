import "server-only";

import { randomUUID } from "crypto";

/** Safe stub until eval persistence matches `ManagerAiOutcomeEval` columns in schema. */
export async function recordRecommendationOutcome(_p: {
  userId: string;
  recommendationId: string;
  outcome: "accepted" | "dismissed" | "expired";
  score?: number;
  payload?: Record<string, unknown>;
}): Promise<{ id: string }> {
  return { id: randomUUID() };
}
