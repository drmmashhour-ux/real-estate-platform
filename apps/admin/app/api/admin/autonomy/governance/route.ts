import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
import { evaluateUnifiedGovernance } from "@/modules/autonomous-marketplace/governance/unified-governance.service";
import type {
  UnifiedGovernanceMode,
  UnifiedGovernanceResult,
} from "@/modules/autonomous-marketplace/governance/unified-governance.types";
import {
  buildGovernanceAdminSummarySlice,
  buildGovernanceInvestorSummarySlice,
} from "@/modules/autonomous-marketplace/dashboard/governance-dashboard.service";

export const dynamic = "force-dynamic";

function apiFallbackGovernance(): UnifiedGovernanceResult {
  return {
    disposition: "REQUIRES_LOCAL_APPROVAL",
    allowExecution: false,
    requiresHumanApproval: true,
    blocked: true,
    policyDecision: "governance_api_fallback",
    legalRisk: {
      score: 50,
      level: "MEDIUM",
      reasons: ["governance_api_fallback"],
      requiresBlock: false,
      requiresApproval: true,
    },
    fraudRisk: {
      score: 50,
      level: "MEDIUM",
      reasons: ["governance_api_fallback"],
      revenueImpactEstimate: 0,
      requiresBlock: false,
      requiresApproval: true,
    },
    combinedRisk: { score: 50, level: "MEDIUM" },
    explainability: {
      summary: "Governance evaluation could not complete — conservative hold.",
      lines: [],
      bullets: ["Try again or review inputs."],
    },
    trace: [],
  };
}

export async function GET(req: NextRequest) {
  if (!engineFlags.autonomousMarketplaceV1 || !autonomyConfig.enabled) {
    return NextResponse.json({ error: "Autonomous marketplace disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = req.nextUrl.searchParams;
  const modeRaw = sp.get("mode") ?? "preview";
  const mode: UnifiedGovernanceMode =
    modeRaw === "execution" ? "execution" : modeRaw === "preview" ? "preview" : "preview";

  let governance: UnifiedGovernanceResult;
  try {
    governance = await evaluateUnifiedGovernance({
      mode,
      actionType: sp.get("actionType") ?? undefined,
      regionCode: sp.get("regionCode") ?? undefined,
      listingId: sp.get("listingId") ?? undefined,
      listingDisplayId: sp.get("listingDisplayId") ?? undefined,
      featureFlags: {
        AUTONOMY_GOVERNANCE_AUTO_EXECUTE: autonomyConfig.governanceAutoExecuteEnabled,
      },
      metadata: { source: "admin_api" },
    });
    return NextResponse.json({
      ok: true,
      governance,
      adminSummary: buildGovernanceAdminSummarySlice(governance),
      investorSummary: buildGovernanceInvestorSummarySlice(governance),
    });
  } catch {
    const g = apiFallbackGovernance();
    return NextResponse.json({
      ok: false,
      governance: g,
      adminSummary: buildGovernanceAdminSummarySlice(g),
      investorSummary: buildGovernanceInvestorSummarySlice(g),
    });
  }
}
