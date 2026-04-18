import type { SimulationRunContext, SimulationScenarioResult, SimulationStepResult } from "./e2e-simulation.types";
import { scenarioRollup } from "./simulation-status.service";
import { apiUrl, fetchEvidence, fullUrl } from "./http-simulation";

export async function stepHttpGet(
  ctx: SimulationRunContext,
  stepId: string,
  title: string,
  path: string,
  expectOk: boolean
): Promise<SimulationStepResult> {
  const url = path.startsWith("/api") ? apiUrl(ctx, path) : fullUrl(ctx, path);
  const { ok, status, snippet } = await fetchEvidence(url, { method: "GET" });
  const pass = expectOk ? ok : !ok;
  const statusPass = expectOk ? status >= 200 && status < 400 : true;
  const good = pass && statusPass;
  return {
    stepId,
    title,
    status: good ? "PASS" : "FAIL",
    details: `HTTP ${status}`,
    routeOrService: url,
    evidence: snippet,
    frictionPoints: status >= 500 ? ["server error"] : [],
    blockers: good ? [] : [`Expected ${expectOk ? "2xx/3xx" : "non-ok"} got ${status}`],
  };
}

/** Public page: expect 200 */
export async function stepPublicPage(ctx: SimulationRunContext, stepId: string, title: string, path: string) {
  const url = fullUrl(ctx, path);
  const { ok, status, snippet } = await fetchEvidence(url, { method: "GET" });
  const good = ok && status >= 200 && status < 400;
  return {
    stepId,
    title,
    status: good ? ("PASS" as const) : ("FAIL" as const),
    details: `GET ${status}`,
    routeOrService: url,
    evidence: snippet,
    frictionPoints: [],
    blockers: good ? [] : [`HTTP ${status}`],
  };
}

/** Protected page without session: expect 401/403/307 redirect to auth */
export async function stepProtectedPageAnonymous(ctx: SimulationRunContext, stepId: string, title: string, path: string) {
  const url = fullUrl(ctx, path);
  const { status, snippet } = await fetchEvidence(url, { method: "GET", redirect: "manual" } as RequestInit);
  const authWall = status === 401 || status === 403 || status === 307 || status === 308;
  const maybeLoginPage =
    status === 200 && /sign\s*in|log\s*in|auth|unauthorized/i.test(snippet);
  const allowed = authWall || maybeLoginPage;
  return {
    stepId,
    title,
    status: allowed ? ("PASS" as const) : status >= 500 ? ("FAIL" as const) : ("WARNING" as const),
    details: `Unauthenticated GET returned ${status}`,
    routeOrService: url,
    evidence: snippet.slice(0, 200),
    frictionPoints: allowed ? [] : ["Could not confirm auth wall — verify middleware"],
    blockers: status >= 500 ? [`HTTP ${status}`] : [],
  };
}

export function finalizeScenario(
  base: Omit<SimulationScenarioResult, "status" | "summary">,
  recommendations: string[] = []
): SimulationScenarioResult {
  return scenarioRollup({ ...base, recommendations });
}
