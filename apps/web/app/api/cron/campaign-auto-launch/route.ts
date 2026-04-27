import { z } from "zod";
import { runAutonomousCampaignLauncher } from "@/lib/marketing/autonomousCampaignLauncher";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  userId: z.string().uuid(),
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST /api/cron/campaign-auto-launch
 * Authorization: Bearer $CRON_SECRET
 * Body: `{ "userId": "<broker user id>" }` — which account to run the launch pipeline for.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/cron/campaign-auto-launch" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await runAutonomousCampaignLauncher({
      userId: parsed.data.userId,
      dryRun: parsed.data.dryRun,
    });
    return Response.json(result);
  } catch (e) {
    logError(e, { route: "/api/cron/campaign-auto-launch" });
    return Response.json({ error: "Auto-launch failed" }, { status: 500 });
  }
}
