import { z } from "zod";
import { requireFounderPitchSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions, patchPitchSlide } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildPitchDeckContent } from "@/modules/pitch-content/pitch-content.service";
import { applyPitchOverridesToDeck } from "@/modules/pitch-content/apply-pitch-overrides";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  headline: z.string().max(2000).optional(),
  bullets: z.array(z.string().max(2000)).max(40).optional(),
  speakerNotes: z.string().max(8000).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ slideNumber: string }> }) {
  const auth = await requireFounderPitchSession();
  if (!auth.ok) return auth.response;

  const { slideNumber: raw } = await ctx.params;
  const slideNum = Number.parseInt(raw, 10);
  if (!Number.isFinite(slideNum) || slideNum < 1 || slideNum > 12) {
    return Response.json({ error: "slideNumber must be 1–12" }, { status: 400 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid patch" }, { status: 400 });
  }

  await patchPitchSlide(auth.userId, slideNum, body);

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

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_pitch_slide_edited",
    payload: { slideNumber: slideNum },
  });

  return Response.json({
    kind: "founder_pitch_slide_patch_v1",
    deck,
    pitchOverrides,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
