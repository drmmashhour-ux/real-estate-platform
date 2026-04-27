import { z } from "zod";

import { runAutonomousCampaignLauncher } from "@/lib/marketing/autonomousCampaignLauncher";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST /api/marketing/campaign/auto-launch — insights → generated copy → draft campaigns (when not dry run) → simulation → selection.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json({ error: "Autonomous marketing disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/auto-launch" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    const result = await runAutonomousCampaignLauncher({
      userId: auth.user.id,
      dryRun: parsed.data.dryRun,
    });
    return Response.json(result);
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/auto-launch" });
    return Response.json({ error: "Auto-launch failed" }, { status: 500 });
  }
}
