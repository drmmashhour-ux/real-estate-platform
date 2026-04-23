import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";
import { engineFlags } from "@/config/feature-flags";
import { parseRegionListingKey } from "@/modules/integrations/regions/region-listing-key.service";
import {
  getSyriaCapabilityNotes,
  getSyriaCapabilitySnapshot,
} from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import { SYRIA_REGION_CODE } from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import type { PreviewListingInput } from "@/modules/autonomous-marketplace/types/listing-preview.types";

export const dynamic = "force-dynamic";

function safeListingId(raw: string | null): string | null {
  if (!raw || raw.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) return null;
  return raw;
}

function resolvePreviewInput(req: NextRequest): {
  input: string | PreviewListingInput;
  ambiguityWarnings: string[];
} {
  const sp = req.nextUrl.searchParams;
  const listingId = safeListingId(sp.get("listingId"));
  const sourceRaw = typeof sp.get("source") === "string" ? sp.get("source")!.trim().toLowerCase() : "";
  const regionCodeRaw = typeof sp.get("regionCode") === "string" ? sp.get("regionCode")!.trim() : "";
  const regionListingKeyRaw = typeof sp.get("regionListingKey") === "string" ? sp.get("regionListingKey")!.trim() : "";

  const ambiguityWarnings: string[] = [];

  if (regionListingKeyRaw) {
    const parsed = parseRegionListingKey(regionListingKeyRaw);
    if (parsed.key) {
      if (parsed.key.source === "syria") {
        return {
          input: {
            listingId: parsed.key.listingId,
            source: "syria",
            regionCode: parsed.key.regionCode,
          },
          ambiguityWarnings: parsed.fallbackNote ? [parsed.fallbackNote] : [],
        };
      }
      return {
        input: {
          listingId: parsed.key.listingId,
          source: parsed.key.source,
          regionCode: parsed.key.regionCode,
        },
        ambiguityWarnings: parsed.fallbackNote ? [parsed.fallbackNote] : [],
      };
    }
    ambiguityWarnings.push(parsed.fallbackNote ?? "region_listing_key_invalid");
  }

  if (!listingId) {
    return { input: "", ambiguityWarnings };
  }

  if (sourceRaw === "syria") {
    return {
      input: {
        listingId,
        source: "syria",
        regionCode: regionCodeRaw || SYRIA_REGION_CODE,
      },
      ambiguityWarnings,
    };
  }

  if (sourceRaw === "external") {
    return {
      input: { listingId, source: "external", regionCode: regionCodeRaw || undefined },
      ambiguityWarnings,
    };
  }

  /** Default web / FSBO path — explicit source recommended when Syria adapter is on (collision-prone ids). */
  if (engineFlags.syriaRegionAdapterV1 && engineFlags.regionListingKeyV1 && !sourceRaw) {
    ambiguityWarnings.push("preview_source_omitted_web_fsbo_default_use_source_syria_or_region_listing_key_for_syria");
  }

  return { input: listingId, ambiguityWarnings };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!engineFlags.autonomousMarketplaceV1) {
      return NextResponse.json({
        preview: null,
        capabilityNotes: getSyriaCapabilityNotes(),
        capabilitySnapshot: getSyriaCapabilitySnapshot(),
        ambiguityWarnings: [],
        flags: {
          autonomousMarketplaceV1: false,
          regionListingKeyV1: engineFlags.regionListingKeyV1 === true,
          syriaRegionAdapterV1: engineFlags.syriaRegionAdapterV1 === true,
          syriaPreviewV1: engineFlags.syriaPreviewV1 === true,
          realPreviewV1: false,
          previewExplainabilityV1: false,
        },
        freshness: { generatedAt: new Date().toISOString() },
      });
    }

    const { input, ambiguityWarnings } = resolvePreviewInput(req);
    if (typeof input === "string" && input === "") {
      return NextResponse.json(
        { error: "Provide listingId or regionListingKey", ambiguityWarnings },
        { status: 400 },
      );
    }

    const generatedAt = new Date().toISOString();
    const preview = await autonomousMarketplaceEngine.previewForListing(input);

    const isSyriaInput = typeof input === "object" && input !== null && "source" in input && input.source === "syria";
    const syriaPreviewEnrichment =
      isSyriaInput && preview.syriaPolicyPreview ?
        {
          policy: preview.syriaPolicyPreview,
          approvalBoundary: preview.syriaApprovalBoundary ?? null,
          syriaPolicyDecision: preview.syriaPolicyDecision ?? null,
          syriaPreviewNotes: preview.syriaPreviewNotes ?? null,
          syriaGovernanceExplainability: preview.syriaGovernanceExplainability ?? null,
          syriaStructuredExplainability: preview.syriaStructuredExplainability ?? null,
          explainabilityNotesSample: [...(preview.explainability?.notes ?? [])].slice(0, 24),
          structuredLinesSample:
            preview.syriaStructuredExplainability ?
              [...preview.syriaStructuredExplainability.structuredLines].slice(0, 24)
            : [],
          bulletsSample:
            preview.syriaStructuredExplainability ?
              [...preview.syriaStructuredExplainability.bullets].slice(0, 16)
            : [],
          flags: {
            executionUnavailableForSyria: preview.executionUnavailableForSyria === true,
            hasPreviewExplanation: Boolean(preview.previewExplanation),
          },
        }
      : null;

    return NextResponse.json({
      preview,
      ...(syriaPreviewEnrichment ? { syriaPreviewEnrichment } : {}),
      capabilityNotes: [...getSyriaCapabilityNotes()],
      capabilitySnapshot: getSyriaCapabilitySnapshot(),
      ambiguityWarnings,
      flags: {
        autonomousMarketplaceV1: engineFlags.autonomousMarketplaceV1 === true,
        regionListingKeyV1: engineFlags.regionListingKeyV1 === true,
        syriaRegionAdapterV1: engineFlags.syriaRegionAdapterV1 === true,
        syriaPreviewV1: engineFlags.syriaPreviewV1 === true,
        realPreviewV1: engineFlags.autonomyRealPreviewV1 === true,
        previewExplainabilityV1:
          engineFlags.autonomyPreviewExplainabilityV1 === true ||
          engineFlags.autonomyExplainabilityV1 === true,
      },
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json({ error: "Preview unavailable" }, { status: 500 });
  }
}
