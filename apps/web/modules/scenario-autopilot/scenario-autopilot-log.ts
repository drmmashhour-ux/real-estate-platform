import type { ScenarioAutopilotStatus } from "./scenario-autopilot.types";

type Tag = "scenario" | "simulation" | "approval" | "execution" | "rollback" | "outcome";

export const scenarioAutopilotLog = {
  line(tag: Tag, message: string, extra?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "test" && !process.env.SCENARIO_AUTOPILOT_LOG_TEST) return;
    const prefix =
      tag === "scenario" ? "[scenario]"
      : tag === "simulation" ? "[simulation]"
      : tag === "approval" ? "[approval]"
      : tag === "execution" ? "[execution]"
      : tag === "rollback" ? "[rollback]"
      : "[outcome]";
    // eslint-disable-next-line no-console
    console.info(prefix, message, extra ? JSON.stringify(extra) : "");
  },
  transition(runId: string, from: ScenarioAutopilotStatus, to: ScenarioAutopilotStatus, actorId?: string) {
    this.line("approval", `status ${from} → ${to}`, { runId, actorId });
  },
};
