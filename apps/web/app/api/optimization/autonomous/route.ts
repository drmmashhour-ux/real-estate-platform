import { z } from "zod";

import { runAutonomousOptimizationLoop } from "@/lib/growth/autonomousOptimizationLoop";
import { flags } from "@/lib/flags";
import { requireUser } from "@/lib/auth/require-user";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  dryRun: z.boolean().optional().default(true),
});

/**
 * POST /api/optimization/autonomous — daily loop: signals → actions (audit + events only).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.AUTONOMOUS_OPTIMIZATION_LOOP) {
    return Response.json(
      { ok: false, disabled: true, error: "Autonomous optimization loop disabled" },
      { status: 403 }
    );
  }
  const auth = await requireUser();
  if (!auth.ok) {
    return auth.response;
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/optimization/autonomous" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await runAutonomousOptimizationLoop({
      dryRun: parsed.data.dryRun,
      trigger: "api",
    });
    return Response.json(result);
  } catch (e) {
    logError(e, { route: "/api/optimization/autonomous" });
    return Response.json({ error: "Autonomous optimization failed" }, { status: 500 });
  }
}
