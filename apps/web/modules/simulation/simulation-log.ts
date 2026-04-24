import type { ScenarioInput } from "./simulation.types";

export type SimulationLogEvent = "preview" | "scenario_saved" | "scenario_recommended" | "scenario_deleted";

/**
 * Auditable, structured console logging only — no production table writes.
 * Forward to your log drain in production if needed.
 */
export const simulationLog = {
  emit(kind: SimulationLogEvent, payload: { userId: string; input?: ScenarioInput; scenarioId?: string; note?: string }) {
    if (process.env.NODE_ENV === "test") return;
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        source: "lecipm_what_if",
        kind,
        ...payload,
        at: new Date().toISOString(),
      }),
    );
  },
};
