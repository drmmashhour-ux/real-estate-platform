import { requireFounderPitchSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildPitchDeckContent } from "@/modules/pitch-content/pitch-content.service";
import { applyPitchOverridesToDeck } from "@/modules/pitch-content/apply-pitch-overrides";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireFounderPitchSession();
  if (!auth.ok) return auth.response;

  const row = await getFounderSimulationState(auth.userId);
  const overrides = parseStoredAssumptions(row?.assumptionsJson);
  const { projections } = runStoredSimulationTriplet(overrides);

  const base = buildPitchDeckContent({
    conservative: projections.conservative,
    baseline: projections.baseline,
    optimistic: projections.optimistic,
    actualTractionNote: null,
  });

  const pitchOverrides = (row?.pitchOverridesJson as StoredPitchOverrides | null) ?? {};
  const deck = applyPitchOverridesToDeck(base, pitchOverrides);

  return Response.json({
    kind: "founder_pitch_deck_v1",
    label: "generated_copy_estimates_not_audited",
    deck,
    pitchOverrides,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
