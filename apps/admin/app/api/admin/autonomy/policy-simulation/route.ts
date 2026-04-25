import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
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
    const report = comparePolicyScenarios(DEMO_POLICY_SIMULATION_CASES, DEMO_BASELINE_CONFIG, DEMO_SCENARIO_CONFIGS);
    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (e) {
    console.error("[policy-simulation] GET failed", e);
    return NextResponse.json({ ok: false, error: "Policy simulation failed" }, { status: 500 });
  }
}
