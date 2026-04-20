import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { isAutonomyOsDashboardEnabled } from "@/modules/autonomy/lib/autonomy-layer-gate";
import { logAutonomy } from "@/modules/autonomy/lib/autonomy-log";
import { buildAutonomyImpactSummary } from "@/modules/autonomy/analytics/autonomy-impact-attribution.service";
import { listRecentAutonomyPricingDecisions } from "@/modules/autonomy/api/autonomy-os-persist.service";
import { getAutonomousSystemHealth } from "@/modules/autonomy/engine/autonomy-governance.service";
import { buildLearningSnapshot } from "@/modules/autonomy/learning/learning-engine.service";
import { listOutcomeEvents } from "@/modules/autonomy/learning/outcome-tracking.service";
import { getAutonomyPolicyMonitoringSnapshot } from "@/modules/autonomy/policy/autonomy-policy-monitoring.service";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!isAutonomyOsDashboardEnabled()) {
    return NextResponse.json(
      { error: "Autonomy dashboard is disabled (FEATURE_AUTONOMY_CORE_V1 + FEATURE_AUTONOMY_DASHBOARD_V1)." },
      { status: 503 },
    );
  }

  const events = listOutcomeEvents();

  const pricing = await listRecentAutonomyPricingDecisions(15);

  logAutonomy("[autonomy:dashboard:snapshot]", {
    outcomes: events.length,
    pricingRows: pricing.length,
  });

  return NextResponse.json({
    health: getAutonomousSystemHealth(events),
    learning: buildLearningSnapshot(events),
    impact: buildAutonomyImpactSummary(events),
    pricing,
    policyMonitoring: getAutonomyPolicyMonitoringSnapshot(),
  });
}
