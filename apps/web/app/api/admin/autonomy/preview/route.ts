import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { adminListingPreviewBodySchema } from "@/modules/autonomous-marketplace/api/zod-schemas";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";
import { getSyriaCapabilityNotes } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";

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

  const parsed = adminListingPreviewBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { listingId, source, regionCode } = parsed.data;

  if (source === "syria") {
    if (!engineFlags.syriaRegionAdapterV1) {
      return NextResponse.json(
        {
          error: "Syria region adapter disabled — cannot preview Syria listings.",
          code: "syria_adapter_off",
        },
        { status: 400 },
      );
    }
    if (regionCode != null && regionCode !== "sy") {
      return NextResponse.json(
        {
          error: "Syria preview requires regionCode `sy` when specified.",
          code: "syria_region_code_invalid",
        },
        { status: 400 },
      );
    }
  }

  try {
    const freshness = new Date().toISOString();
    const preview = await autonomousMarketplaceEngine.previewForListing({
      listingId,
      source,
      ...(source === "syria" ? { regionCode: "sy" } : regionCode ? { regionCode } : {}),
      dryRun: true,
    });

    return NextResponse.json({
      ok: true as const,
      dryRun: true as const,
      freshness,
      listingId: preview.listingId,
      source,
      preview,
      regionCapabilityNotes: source === "syria" ? [...getSyriaCapabilityNotes()] : [],
      flags: {
        regionListingKey: engineFlags.regionListingKeyV1,
        syriaPreview: engineFlags.syriaPreviewV1,
        syriaAdapter: engineFlags.syriaRegionAdapterV1,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
