import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { previewBodySchema } from "@/modules/autonomous-marketplace/api/zod-schemas";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";

export const dynamic = "force-dynamic";

/** Generic POST — same body as `/api/autonomy/preview`; default dryRun=false for explicit runs. */
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
  const parsed = previewBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const opts = {
      mode: parsed.data.mode,
      dryRun: parsed.data.dryRun ?? false,
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

    return NextResponse.json({ ok: true, run });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
