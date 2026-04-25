import type { DecisionMode } from "../types";

export type ExecutionContext = {
  userId: string;
  correlationId: string;
  decisionMode: DecisionMode;
};
