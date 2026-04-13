import type { LecipmCoreAutopilotEventType } from "./types";

export function logAutopilotRun(summary: {
  event: LecipmCoreAutopilotEventType;
  runId: string;
  rulesEvaluated: number;
  actionsProduced: number;
  actionsExecuted: number;
  skippedReasons: string[];
  approvalRequired: number;
}): void {
  console.info("[lecipm-core-autopilot]", JSON.stringify({ level: "info", ...summary }));
}
