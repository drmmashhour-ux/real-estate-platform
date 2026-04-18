import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { GrowthOrchestrator } from "@/src/modules/growth/growth-orchestrator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  void request;
  const summary = await GrowthOrchestrator.run();
  return Response.json({ ok: true, summary });
}
