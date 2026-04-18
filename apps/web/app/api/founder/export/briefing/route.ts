import { z } from "zod";
import { requireFounderPitchExportSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildPitchDeckContent } from "@/modules/pitch-content/pitch-content.service";
import { applyPitchOverridesToDeck } from "@/modules/pitch-content/apply-pitch-overrides";
import type { StoredPitchOverrides } from "@/lib/founder-simulation-state.service";
import { buildFounderReportExport } from "@/modules/founder-export/report-export.service";
import type { FounderReportExportFormat } from "@/modules/founder-export/founder-export.types";
import { founderSimulationFlags } from "@/config/feature-flags";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["markdown_briefing", "json_bundle"]).optional(),
});

/** Combined simulation + pitch Markdown or JSON bundle — requires pitch export flag + pitch wording. */
export async function POST(request: Request) {
  const auth = await requireFounderPitchExportSession();
  if (!auth.ok) return auth.response;

  if (
    !founderSimulationFlags.investorPitchWordingV1 ||
    !founderSimulationFlags.founderLaunchSimulationV1 ||
    !founderSimulationFlags.montrealProjectionV1
  ) {
    return Response.json({ error: "Briefing export requires simulation + Montreal + pitch wording flags" }, { status: 403 });
  }

  let format: FounderReportExportFormat = "markdown_briefing";
  try {
    const raw = await request.json().catch(() => ({}));
    format = bodySchema.parse(raw).format ?? "markdown_briefing";
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

  const { contentType, filename, body } = buildFounderReportExport(format, { projections, pitch: deck });

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_export_briefing",
    payload: { format, filename },
  });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
