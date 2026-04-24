import { logInfo } from "@/lib/logger";

const TAG = "[agents]";

export type AgentLogEvent = 
  | "agent_action"
  | "agent_performance"
  | "strategy_proposed"
  | "competition_resolved";

export function logAgent(event: AgentLogEvent, payload: Record<string, unknown> = {}) {
  logInfo(`${TAG} ${event}`, payload);
}
