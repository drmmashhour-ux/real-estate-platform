import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runListingBodySchema } from "@/modules/autonomous-marketplace/api/zod-schemas";
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
  const parsed = runListingBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const run = await autonomousMarketplaceEngine.runForListing(parsed.data.listingId, {
      mode: parsed.data.mode,
      dryRun: parsed.data.dryRun ?? false,
      detectorIds: parsed.data.detectorIds,
      actionTypes: parsed.data.actionTypes,
      idempotencyKey: parsed.data.idempotencyKey,
      createdByUserId: auth.userId,
    });
    return NextResponse.json({ ok: true, run });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
