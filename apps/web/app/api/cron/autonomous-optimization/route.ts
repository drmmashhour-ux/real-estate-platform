import { z } from "zod";
import { runAutonomousOptimizationLoop } from "@/lib/growth/autonomousOptimizationLoop";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST /api/cron/autonomous-optimization
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown = {};
  try {
    const t = await req.text();
    if (t) json = JSON.parse(t) as unknown;
  } catch (e) {
    logError(e, { route: "/api/cron/autonomous-optimization" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = json && typeof json === "object" && json !== null ? json : {};
  const parsed = BodyZ.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await runAutonomousOptimizationLoop({
      dryRun: parsed.data.dryRun,
      trigger: "cron",
    });
    return Response.json(result);
  } catch (e) {
    logError(e, { route: "/api/cron/autonomous-optimization" });
    return Response.json({ error: "Autonomous optimization failed" }, { status: 500 });
  }
}
