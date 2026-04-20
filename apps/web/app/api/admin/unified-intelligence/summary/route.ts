import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildUnifiedIntelligenceSummary } from "@/modules/unified-intelligence/unified-intelligence.service";
import type { UnifiedIntelligenceSourceStatus } from "@/modules/unified-intelligence/unified-intelligence.types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.unifiedIntelligenceV1) {
    return NextResponse.json({ error: "Unified intelligence disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const summary = await buildUnifiedIntelligenceSummary();
  const freshness = new Date().toISOString();

  const sourceStatus: UnifiedIntelligenceSourceStatus = {
    canonicalRuns:
      summary.canonicalRunCountHint > 0 ? "available" : summary.availabilityNotes.some((n) => n.includes("marketplace_disabled")) ? "missing" : "partial",
    eventTimeline: "partial",
    legalTrust: "partial",
    notes: summary.availabilityNotes,
  };

  return NextResponse.json({
    intelligence: summary,
    sourceStatus,
    flags: {
      unifiedIntelligenceV1: engineFlags.unifiedIntelligenceV1,
      marketplaceDashboardV1: engineFlags.marketplaceDashboardV1,
      controlledExecutionV1: engineFlags.controlledExecutionV1,
    },
    freshness,
  });
}
