import { z } from "zod";
import { requireFounderPitchSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildPitchDeckContent } from "@/modules/pitch-content/pitch-content.service";
import { applyPitchOverridesToDeck } from "@/modules/pitch-content/apply-pitch-overrides";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  actualTractionNote: z.string().max(4000).optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireFounderPitchSession();
  if (!auth.ok) return auth.response;

  let note: string | null | undefined;
  try {
    const raw = await request.json().catch(() => ({}));
    note = bodySchema.parse(raw).actualTractionNote;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await getFounderSimulationState(auth.userId);
  const overrides = parseStoredAssumptions(row?.assumptionsJson);
  const { projections } = runStoredSimulationTriplet(overrides);

  const base = buildPitchDeckContent({
    conservative: projections.conservative,
    baseline: projections.baseline,
    optimistic: projections.optimistic,
    actualTractionNote: note ?? null,
  });

  const pitchOverrides = (row?.pitchOverridesJson as StoredPitchOverrides | null) ?? {};
  const deck = applyPitchOverridesToDeck(base, pitchOverrides);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_pitch_generated",
    payload: {
      hasTractionNote: Boolean(note?.trim()),
      label: "generated_copy_estimates_not_audited",
    },
  });

  return Response.json({
    kind: "founder_pitch_generate_v1",
    label: "generated_copy_estimates_not_audited",
    deck,
    pitchOverrides,
  });
}
