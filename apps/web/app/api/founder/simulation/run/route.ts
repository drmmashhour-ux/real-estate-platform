import { z } from "zod";
import { requireFounderSimulationSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runScenarioWithOptionalPatch, mergeAssumptionPatch } from "@/modules/launch-simulation/launch-simulation.service";
import type { LaunchSimulationAssumptions, LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    scenario: z.enum(["conservative", "baseline", "optimistic"]).optional(),
    /** One-off patch merged with defaults (not persisted). */
    patch: z.record(z.string(), z.any()).optional(),
    /** When true, merge stored DB overrides for the scenario before applying patch. */
    useStoredAssumptions: z.boolean().optional(),
  })
  .optional();

export async function POST(request: Request) {
  const auth = await requireFounderSimulationSession();
  if (!auth.ok) return auth.response;

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json().catch(() => ({}));
    parsed = bodySchema.parse(raw);
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await getFounderSimulationState(auth.userId);
  const stored = parseStoredAssumptions(row?.assumptionsJson);

  const scenario = (parsed?.scenario ?? "baseline") as LaunchSimulationScenario;
  let patch = (parsed?.patch ?? undefined) as Partial<LaunchSimulationAssumptions> | undefined;

  if (parsed?.useStoredAssumptions && stored[scenario]) {
    patch = { ...stored[scenario], ...patch };
  }

  const result = runScenarioWithOptionalPatch(scenario, patch);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_simulation_run",
    payload: {
      scenario,
      usedStoredAssumptions: Boolean(parsed?.useStoredAssumptions),
      label: "projected_estimate",
    },
  });

  return Response.json({
    kind: "founder_simulation_run_v1",
    label: "projected_estimates_not_actuals",
    scenario,
    mergedAssumptions: mergeAssumptionPatch(scenario, patch),
    projection: result.projection,
    summary: result.summary,
  });
}
