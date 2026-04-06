import type { ScenarioContext } from "../scenarios/_context";

/** Merge diagnostic fields for E2E failure reports (no-op if partial empty). */
export function setE2eDiagnosticContext(
  ctx: ScenarioContext,
  patch: Partial<Pick<ScenarioContext["state"], keyof ScenarioContext["state"]>>,
): void {
  Object.assign(ctx.state, patch);
}
