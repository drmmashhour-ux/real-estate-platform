import { requireFounderSimulationSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireFounderSimulationSession();
  if (!auth.ok) return auth.response;

  const row = await getFounderSimulationState(auth.userId);
  const overrides = parseStoredAssumptions(row?.assumptionsJson);
  const { projections, summaries } = runStoredSimulationTriplet(overrides);

  return Response.json({
    kind: "founder_simulation_state_v1",
    label: "projected_estimates_not_actuals",
    assumptionsOverrides: overrides,
    projections,
    summaries,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
