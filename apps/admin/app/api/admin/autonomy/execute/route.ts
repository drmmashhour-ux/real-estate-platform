import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
import { adminAutonomyExecuteBodySchema } from "@/modules/autonomous-marketplace/api/admin-autonomy.schema";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!engineFlags.autonomousMarketplaceV1) {
    return NextResponse.json({ error: "Autonomous marketplace disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminAutonomyExecuteBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const dryRun = parsed.data.dryRun ?? true;
    const mode = parsed.data.mode ?? autonomyConfig.defaultMode;
    const opts = {
      mode,
      dryRun,
      detectorIds: parsed.data.detectorIds,
      actionTypes: parsed.data.actionTypes,
      idempotencyKey: parsed.data.idempotencyKey,
      createdByUserId: auth.userId,
    };

    let run;
    if (parsed.data.targetType === "fsbo_listing") {
      run = await autonomousMarketplaceEngine.runForListing(parsed.data.targetId, opts);
    } else if (parsed.data.targetType === "lead") {
      run = await autonomousMarketplaceEngine.runForLead(parsed.data.targetId, opts);
    } else {
      run = await autonomousMarketplaceEngine.runForCampaign(parsed.data.targetId, opts);
    }

    return NextResponse.json({
      ok: true,
      summary: run.summary,
      actionsProposed: run.summary.actionsProposed,
      actionCount: run.actions.length,
      hints: {
        regionCode: parsed.data.regionCode ?? null,
        source: parsed.data.source ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "run_failed", message: String(e) }, { status: 500 });
  }
}
