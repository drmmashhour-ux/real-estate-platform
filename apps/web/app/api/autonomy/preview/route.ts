import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listingPreviewInputSchema, previewBodySchema } from "@/modules/autonomous-marketplace/api/zod-schemas";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";
import type { ListingPreviewResponse } from "@/modules/autonomous-marketplace/types/listing-preview.types";

export const dynamic = "force-dynamic";

function listingPreviewPayload(preview: ListingPreviewResponse, dryRun: boolean) {
  return {
    ok: true as const,
    dryRun,
    listingId: preview.listingId,
    signals: preview.observation.signals,
    opportunities: preview.opportunities,
    actions: preview.proposedActions,
    decisions: preview.policyDecisions,
    executionResult: preview.executionResult,
    observation: preview.observation,
    opportunityEvaluations: preview.opportunityEvaluations,
    autonomyMode: preview.autonomyMode,
    metrics: preview.metrics,
    riskBuckets: preview.riskBuckets,
    regionListingRef: preview.regionListingRef ?? null,
    previewNotes: preview.previewNotes,
    capabilityNotes: preview.capabilityNotes,
    executionUnavailableForSyria: preview.executionUnavailableForSyria ?? false,
    explainability: preview.explainability,
  };
}

/**
 * Preview-first endpoint:
 * - `{ listingId }` → read-only `previewForListing` (policy evaluated; **no executor**, no autonomy run persistence).
 * - `{ targetType: fsbo_listing, targetId }` → same preview path (legacy body).
 * - lead/campaign → forced `dryRun: true` full engine path (still logs; no live execution).
 */
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

  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  const listingShortcut =
    body && typeof body.listingId === "string" && body.targetType === undefined;

  if (listingShortcut) {
    const parsed = listingPreviewInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const { listingId, dryRun, source, regionCode } = parsed.data;
      const preview =
        source != null || regionCode != null
          ? await autonomousMarketplaceEngine.previewForListing({
              listingId,
              ...(source ? { source } : {}),
              ...(regionCode ? { regionCode } : {}),
              dryRun,
            })
          : await autonomousMarketplaceEngine.previewForListing(listingId);
      return NextResponse.json(listingPreviewPayload(preview, dryRun));
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  const parsed = previewBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const dryRunAlways = true;
    const opts = {
      mode: parsed.data.mode ?? "ASSIST",
      dryRun: dryRunAlways,
      detectorIds: parsed.data.detectorIds,
      actionTypes: parsed.data.actionTypes,
      idempotencyKey: parsed.data.idempotencyKey,
      createdByUserId: auth.userId,
    };

    if (parsed.data.targetType === "fsbo_listing") {
      const preview = await autonomousMarketplaceEngine.previewForListing(parsed.data.targetId);
      return NextResponse.json(listingPreviewPayload(preview, dryRunAlways));
    }

    let result;
    if (parsed.data.targetType === "lead") {
      result = await autonomousMarketplaceEngine.runForLead(parsed.data.targetId, opts);
    } else {
      result = await autonomousMarketplaceEngine.runForCampaign(parsed.data.targetId, opts);
    }

    return NextResponse.json({ ok: true, preview: false, dryRun: true, run: result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
