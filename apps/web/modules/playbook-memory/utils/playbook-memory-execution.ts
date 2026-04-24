import type { PlaybookExecutionMode } from "@prisma/client";
import type { PlaybookExecutionPlan } from "../types/playbook-memory.types";

function isExecutionMode(m: unknown): m is PlaybookExecutionMode {
  return (
    m === "RECOMMEND_ONLY" ||
    m === "HUMAN_APPROVAL" ||
    m === "SAFE_AUTOPILOT" ||
    m === "FULL_AUTOPILOT"
  );
}

/**
 * Build a plan from a playbook recommendation. Side-effect free.
 * The caller (e.g. `POST /execute`) may set `plan.payload` before `execute` for memory context.
 */
export function buildExecutionPlan(
  /** Accept a `PlaybookRecommendation` or a loose object from the client. */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  recommendation: any,
): PlaybookExecutionPlan {
  const r = recommendation as Record<string, unknown>;
  const em = r.executionMode;
  const mode: PlaybookExecutionPlan["executionMode"] = isExecutionMode(em) ? em : "RECOMMEND_ONLY";
  return {
    playbookId: String(r.playbookId ?? ""),
    playbookVersionId:
      r.playbookVersionId === null || r.playbookVersionId === "none" || r.playbookVersionId === undefined
        ? null
        : String(r.playbookVersionId),
    actionType: r.actionType == null || r.actionType === "" ? null : String(r.actionType),
    payload: {},
    executionMode: mode,
  };
}

