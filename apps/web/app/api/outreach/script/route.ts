import { z } from "zod";
import { launchSystemV1Flags } from "@/config/feature-flags";
import { requireLaunchSystemPlatform } from "@/lib/launch-system-api-auth";
import { buildOutreachScript, type OutreachChannel } from "@/modules/outreach/outreach-script.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { trackOutreachScriptGenerated } from "@/lib/analytics/launch-analytics";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  channel: z.enum(["instagram_dm", "email_short", "email_long", "call"]),
  area: z.string().max(200),
  founderFirstName: z.string().max(120).optional(),
});

/** POST /api/outreach/script — generates editable draft only (no send). */
export async function POST(req: Request) {
  const auth = await requireLaunchSystemPlatform();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.outreachCrmV1) {
    return Response.json({ error: "Outreach module disabled" }, { status: 403 });
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

  const pack = buildOutreachScript(parsed.data.channel as OutreachChannel, {
    area: parsed.data.area,
    founderFirstName: parsed.data.founderFirstName,
  });

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "outreach_script_generated",
    payload: { channel: pack.channel },
  });
  trackOutreachScriptGenerated({ channel: pack.channel });

  return Response.json({ ok: true, script: pack });
}
