import { NextRequest } from "next/server";

import { runGrowthEngineCycle } from "@/modules/growth-engine";

export const dynamic = "force-dynamic";

/** POST /api/cron/growth-engine — periodic growth cycle. Bearer $CRON_SECRET */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGrowthEngineCycle();
    return Response.json({ ok: true, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "growth_engine_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
