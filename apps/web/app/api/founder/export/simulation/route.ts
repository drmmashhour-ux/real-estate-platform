import { z } from "zod";
import { requireFounderSimulationExportSession } from "@/lib/founder-simulation-api-auth";
import { getFounderSimulationState, parseStoredAssumptions } from "@/lib/founder-simulation-state.service";
import { runStoredSimulationTriplet } from "@/lib/founder-simulation-run";
import { buildSimulationExport } from "@/modules/founder-export/simulation-export.service";
import type { SimulationExportFormat } from "@/modules/founder-export/founder-export.types";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["json", "csv", "markdown"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireFounderSimulationExportSession();
  if (!auth.ok) return auth.response;

  let format: SimulationExportFormat = "json";
  try {
    const raw = await request.json().catch(() => ({}));
    format = bodySchema.parse(raw).format ?? "json";
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await getFounderSimulationState(auth.userId);
  const overrides = parseStoredAssumptions(row?.assumptionsJson);
  const { projections } = runStoredSimulationTriplet(overrides);

  const { contentType, filename, body } = buildSimulationExport(format, projections);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "founder_export_simulation",
    payload: { format, filename, label: "projected_estimates_not_actuals" },
  });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
