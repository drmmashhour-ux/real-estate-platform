import { z } from "zod";
import { requireFounderPitchExportSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildPitchDeckContent } from "@/modules/pitch-content/pitch-content.service";
import { applyPitchOverridesToDeck } from "@/modules/pitch-content/apply-pitch-overrides";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";
import { buildPitchExport } from "@/modules/founder-export/pitch-export.service";
import type { PitchExportFormat } from "@/modules/founder-export/founder-export.types";
import { founderSimulationFlags } from "@/config/feature-flags";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["json", "markdown", "deck_structured", "pdf_payload"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireFounderPitchExportSession();
  if (!auth.ok) return auth.response;

  if (!founderSimulationFlags.investorPitchWordingV1) {
    return Response.json({ error: "Pitch wording export disabled" }, { status: 403 });
  }

  let format: PitchExportFormat = "markdown";
  try {
    const raw = await request.json().catch(() => ({}));
    format = bodySchema.parse(raw).format ?? "markdown";
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
    actualTractionNote: null,
  });

  const pitchOverrides = (row?.pitchOverridesJson as StoredPitchOverrides | null) ?? {};
  const deck = applyPitchOverridesToDeck(base, pitchOverrides);

  const { contentType, filename, body } = buildPitchExport(format, deck);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_export_pitch",
    payload: { format, filename },
  });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
