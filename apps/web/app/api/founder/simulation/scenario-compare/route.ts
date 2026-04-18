import { z } from "zod";
import { requireFounderSimulationSession } from "@/lib/founder-simulation-api-auth";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  from: z.enum(["conservative", "baseline", "optimistic"]).optional(),
  to: z.enum(["conservative", "baseline", "optimistic"]),
});

/** Client-called when founder switches scenario tabs — audit only. */
export async function POST(request: Request) {
  const auth = await requireFounderSimulationSession();
  if (!auth.ok) return auth.response;

  try {
    const body = bodySchema.parse(await request.json());
    await logGrowthEngineAudit({
      actorUserId: auth.userId,
      action: "founder_scenario_compared",
      payload: { from: body.from ?? null, to: body.to },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
}
