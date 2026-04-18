import { z } from "zod";
import { launchSystemV1Flags } from "@/config/feature-flags";
import { requireLaunchSystemPlatform } from "@/lib/launch-system-api-auth";
import { createOutreachLead } from "@/modules/outreach-crm/crm.service";
import { scoreHostAcquisitionLead } from "@/modules/host-acquisition/lead-scorer.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { trackAcquisitionLeadCreated } from "@/lib/analytics/launch-analytics";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  contact: z.string().min(3).max(500),
  type: z.string().max(64),
  source: z.string().max(64),
  status: z.string().max(64).optional(),
  name: z.string().max(200).optional(),
  notes: z.string().max(8000).optional(),
  market: z.string().max(200).optional(),
});

/** POST /api/acquisition/add-lead — manual CRM row (no auto outreach). */
export async function POST(req: Request) {
  const auth = await requireLaunchSystemPlatform();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.hostAcquisitionPipelineV1 || !launchSystemV1Flags.outreachCrmV1) {
    return Response.json({ error: "Outreach CRM disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const row = await createOutreachLead({
    ...parsed.data,
    createdByUserId: auth.userId,
  });

  const score = scoreHostAcquisitionLead({
    market: parsed.data.market,
    source: parsed.data.source,
    hasContact: true,
  });

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "outreach_lead_created",
    payload: { leadId: row.id },
  });
  trackAcquisitionLeadCreated({ leadId: row.id, source: row.source });

  return Response.json({ ok: true, lead: row, score });
}
