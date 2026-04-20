import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/require-role";
import { runAutonomyCycle } from "@/modules/autonomy/autonomy-orchestrator.service";

export const dynamic = "force-dynamic";

/**
 * Batch runner for scheduled checks. Authenticate with `x-autonomy-cron-secret` matching `AUTONOMY_CRON_SECRET`,
 * or platform **admin** session.
 */
export async function POST(req: Request) {
  const secretHeader = req.headers.get("x-autonomy-cron-secret")?.trim();
  const expected = process.env.AUTONOMY_CRON_SECRET?.trim();
  const secretOk = Boolean(expected && secretHeader === expected);

  if (!secretOk) {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth.response;
  }

  const configs = await prisma.autonomyConfig.findMany({
    where: { isEnabled: true },
    take: 50,
  });

  const results: unknown[] = [];

  for (const c of configs) {
    try {
      const r = await runAutonomyCycle(c.scopeType, c.scopeId);
      results.push({ scopeType: c.scopeType, scopeId: c.scopeId, actions: r });
    } catch (e) {
      results.push({
        scopeType: c.scopeType,
        scopeId: c.scopeId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ success: true, processed: configs.length, results });
}
