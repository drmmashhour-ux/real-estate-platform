import { z } from "zod";
import { requireFounderSimulationSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions, patchScenarioAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import type { LaunchSimulationAssumptions, LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  scenario: z.enum(["conservative", "baseline", "optimistic"]),
  patch: z.record(z.string(), z.any()),
});

export async function PATCH(request: Request) {
  const auth = await requireFounderSimulationSession();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body — expect { scenario, patch }" }, { status: 400 });
  }

  const scenario = body.scenario as LaunchSimulationScenario;
  const patch = body.patch as Partial<LaunchSimulationAssumptions>;

  await patchScenarioAssumptions(auth.userId, scenario, patch);

  const row = await getFounderSimulationState(auth.userId);
  const overrides = parseStoredAssumptions(row?.assumptionsJson);
  const { projections, summaries } = runStoredSimulationTriplet(overrides);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_simulation_assumptions_edited",
    payload: { scenario, keys: Object.keys(patch) },
  });

  return Response.json({
    kind: "founder_simulation_assumptions_patch_v1",
    label: "projected_estimates_not_actuals",
    scenario,
    assumptionsOverrides: overrides,
    projections,
    summaries,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
