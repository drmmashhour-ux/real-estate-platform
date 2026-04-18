import { validatePage } from "@/modules/validation/page-validator.service";
import type { ScenarioResult, ScenarioStepResult } from "@/modules/validation/types";
import type { FlowDefinition } from "./flow-definitions";

export async function runFlowScenario(baseUrl: string, flow: FlowDefinition): Promise<ScenarioResult> {
  const steps: ScenarioStepResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const t0 = Date.now();

  for (const step of flow.steps) {
    const st = Date.now();
    const r = await validatePage({ baseUrl, path: step.path, allowAuthWall: true });
    const ms = Date.now() - st;
    const ok = r.status !== "fail";
    steps.push({
      name: step.name,
      ok,
      detail: r.errors.join("; ") || r.warnings.join("; ") || undefined,
      ms,
    });
    if (!ok) errors.push(`${step.name}:${r.errors.join(";")}`);
    if (r.warnings.length) warnings.push(`${step.name}:${r.warnings.join(";")}`);
  }

  const anyFail = steps.some((s) => !s.ok);
  return {
    id: flow.id,
    label: flow.label,
    status: anyFail ? "fail" : "pass",
    steps,
    errors,
    warnings,
  };
}
