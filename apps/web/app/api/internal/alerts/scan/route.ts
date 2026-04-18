import { NextRequest } from "next/server";
import { requireCronSecretOrAdmin } from "@/lib/server/verify-cron-or-admin";
import { runAlertCandidateScan } from "@/src/modules/alerts/alert.engine";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** POST /api/internal/alerts/scan */
export async function POST(request: NextRequest) {
  const gate = await requireCronSecretOrAdmin(request);
  if (!gate.ok) return gate.response;
  void request;

  const out = await runAlertCandidateScan();
  logInfo("[internal/alerts/scan]", { ...out, actor: gate.mode });

  return Response.json({ ok: true, ...out });
}
