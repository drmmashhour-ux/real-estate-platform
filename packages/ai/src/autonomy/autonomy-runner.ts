import { randomUUID } from "crypto";
import type { AutomationRuleKey } from "../actions/automation-rules";
import { runAllAutomations } from "../actions/automation-runner";
import { logManagerAgentRun } from "../logger";
import { publishLecipmAiEvent } from "@/lib/realtime/lecipm-ai-events";
import { assertPlatformAutomationGate } from "./autonomy-state";

export type AutonomyTickResult = {
  correlationId: string;
  skipped?: boolean;
  reason?: string;
  automationResults?: Awaited<ReturnType<typeof runAllAutomations>>;
};

export async function runAutonomyTick(keys?: AutomationRuleKey[]): Promise<AutonomyTickResult> {
  const correlationId = randomUUID();
  const gate = await assertPlatformAutomationGate();
  if (!gate.ok) {
    await logManagerAgentRun({
      agentKey: "admin_insights",
      decisionMode: "ASSIST_ONLY",
      inputSummary: `autonomy_tick_skipped`,
      outputSummary: gate.reason,
      status: "completed",
      result: { correlationId, gate },
    });
    return { correlationId, skipped: true, reason: gate.reason };
  }

  const automationResults = await runAllAutomations(keys);
  await logManagerAgentRun({
    agentKey: "admin_insights",
    decisionMode: "AUTO_EXECUTE_SAFE",
    inputSummary: `autonomy_tick:${correlationId}`,
    outputSummary: `rules:${automationResults.length}`,
    status: "completed",
    result: { correlationId, automationResults },
  });
  await publishLecipmAiEvent({
    event: "ai_action_executed",
    correlationId,
    payload: { kind: "autonomy_tick", ruleCount: automationResults.length },
  });
  return { correlationId, automationResults };
}
