import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
import {
  analyzeGovernanceIntelligence,
  buildDemoGovernanceFeedbackRecordsForIntelligence,
} from "@/modules/autonomous-marketplace/feedback/governance-feedback-intelligence.service";
import { listGovernanceFeedbackRecordsLastN } from "@/modules/autonomous-marketplace/feedback/governance-feedback.repository";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 500;

export async function GET(req: NextRequest) {
  if (!engineFlags.autonomousMarketplaceV1 || !autonomyConfig.enabled) {
    return NextResponse.json({ ok: false, error: "Autonomous marketplace disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const parsed = limitRaw ? parseInt(limitRaw, 10) : DEFAULT_LIMIT;
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 5000) : DEFAULT_LIMIT;

    const demoRequested = req.nextUrl.searchParams.get("demo") === "1";

    let stored = listGovernanceFeedbackRecordsLastN(limit);
    let usedDemoRecords = false;

    if (stored.length === 0 && demoRequested) {
      stored = buildDemoGovernanceFeedbackRecordsForIntelligence();
      usedDemoRecords = true;
    }

    const analysis = analyzeGovernanceIntelligence(stored);

    return NextResponse.json({
      ok: true,
      ...analysis,
      usedDemoRecords,
      recordCount: stored.length,
    });
  } catch (e) {
    console.error("[governance-intelligence] GET failed", e);
    return NextResponse.json({ ok: false, error: "Intelligence build failed" }, { status: 500 });
  }
}
