import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { snapshotExperimentResults } from "@/src/modules/experiments/experiment.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.experimentsV1) {
    return Response.json({ ok: false, error: "FEATURE_EXPERIMENTS_V1 disabled" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { experimentId?: string };
  if (!body.experimentId?.trim()) {
    return Response.json({ ok: false, error: "experimentId required" }, { status: 400 });
  }
  const snap = await snapshotExperimentResults(body.experimentId.trim());
  return Response.json({ ok: true, snapshot: snap });
}
