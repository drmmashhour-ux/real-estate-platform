import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
import {
  buildPolicyProposalAdminSummary,
  buildPolicyProposalInvestorSummary,
} from "@/modules/autonomous-marketplace/dashboard/policy-proposal-dashboard.service";
import { buildGovernancePerformanceSummary } from "@/modules/autonomous-marketplace/feedback/governance-feedback-metrics.service";
import { analyzeGovernanceIntelligence } from "@/modules/autonomous-marketplace/feedback/governance-feedback-intelligence.service";
import { listGovernanceFeedbackRecordsLastN } from "@/modules/autonomous-marketplace/feedback/governance-feedback.repository";
import { buildPolicyProposalInputFromSignals } from "@/modules/autonomous-marketplace/proposals/policy-proposal-engine.service";
import { buildPolicyProposalReport } from "@/modules/autonomous-marketplace/proposals/policy-proposal-report.service";
import {
  DEMO_BASELINE_CONFIG,
  DEMO_POLICY_SIMULATION_CASES,
  DEMO_SCENARIO_CONFIGS,
} from "@/modules/autonomous-marketplace/simulation/policy-simulation-demo-cases";
import { comparePolicyScenarios } from "@/modules/autonomous-marketplace/simulation/policy-simulation-comparator.service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  if (!engineFlags.autonomousMarketplaceV1 || !autonomyConfig.enabled) {
    return NextResponse.json({ ok: false, error: "Autonomous marketplace disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const rows = listGovernanceFeedbackRecordsLastN(500);
    const results = rows.map((r) => r.result);
    const performanceSummary = buildGovernancePerformanceSummary(results);

    const intelligence = analyzeGovernanceIntelligence(rows);

    const simulationReport = comparePolicyScenarios(
      DEMO_POLICY_SIMULATION_CASES,
      DEMO_BASELINE_CONFIG,
      DEMO_SCENARIO_CONFIGS,
    );

    const input = buildPolicyProposalInputFromSignals({
      performanceSummary,
      intelligence,
      simulationReport,
    });

    const report = buildPolicyProposalReport(input);
    const adminSummary = buildPolicyProposalAdminSummary(report);
    const investorSummary = buildPolicyProposalInvestorSummary(report);

    return NextResponse.json({
      ok: true,
      report,
      adminSummary,
      investorSummary,
    });
  } catch (e) {
    console.error("[policy-proposals] GET failed", e);
    const fallbackReport = buildPolicyProposalReport({});
    return NextResponse.json({
      ok: true,
      report: fallbackReport,
      adminSummary: buildPolicyProposalAdminSummary(fallbackReport),
      investorSummary: buildPolicyProposalInvestorSummary(fallbackReport),
      fallback: true,
    });
  }
}
