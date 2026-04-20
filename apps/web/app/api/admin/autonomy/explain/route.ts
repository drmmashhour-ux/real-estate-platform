import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildListingExplanation } from "@/modules/autonomous-marketplace/explainability/explainability-builder.service";
import type { ExplanationLevel } from "@/modules/autonomous-marketplace/explainability/explainability.types";
import { autonomousMarketplaceEngine } from "@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine";

export const dynamic = "force-dynamic";

function parseLevel(raw: string | null): ExplanationLevel | undefined {
  if (raw === "simple" || raw === "detailed" || raw === "debug") return raw;
  return undefined;
}

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!engineFlags.autonomousMarketplaceV1) {
    return NextResponse.json({ error: "Autonomous marketplace disabled", disabled: true }, { status: 403 });
  }

  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const listingId = url.searchParams.get("listingId")?.trim() ?? "";
  const levelParam = parseLevel(url.searchParams.get("level"));

  if (!listingId || listingId.length > 128) {
    return NextResponse.json({ error: "listingId required (max 128 chars)" }, { status: 400 });
  }

  const freshness = new Date().toISOString();

  try {
    const preview = await autonomousMarketplaceEngine.previewForListing(listingId);

    if (!engineFlags.autonomyExplainabilityV1) {
      return NextResponse.json({
        explanation: null,
        userSafeReasoningSummary: null,
        disabled: true,
        flags: {
          autonomyExplainabilityV1: false,
          autonomyExplainabilityDebugV1: engineFlags.autonomyExplainabilityDebugV1,
        },
        freshness,
      });
    }

    const level: ExplanationLevel =
      levelParam ??
      (engineFlags.autonomyExplainabilityDebugV1 === true ? "debug" : "detailed");

    const explanation = buildListingExplanation({
      listingId: preview.listingId,
      signals: preview.signals,
      opportunities: preview.opportunities,
      policyDecisions: preview.policyDecisions,
      proposedActions: preview.proposedActions,
      observation: preview.observation,
      level,
      includeDebugRuleRefs: level === "debug" || engineFlags.autonomyExplainabilityDebugV1 === true,
    });

    return NextResponse.json({
      explanation,
      userSafeReasoningSummary: preview.userSafeReasoningSummary ?? null,
      flags: {
        autonomyExplainabilityV1: true,
        autonomyExplainabilityDebugV1: engineFlags.autonomyExplainabilityDebugV1,
      },
      freshness,
    });
  } catch {
    return NextResponse.json(
      {
        explanation: null,
        userSafeReasoningSummary: null,
        flags: {
          autonomyExplainabilityV1: engineFlags.autonomyExplainabilityV1,
          autonomyExplainabilityDebugV1: engineFlags.autonomyExplainabilityDebugV1,
        },
        freshness,
        error: "preview_unavailable",
      },
      { status: 200 },
    );
  }
}
