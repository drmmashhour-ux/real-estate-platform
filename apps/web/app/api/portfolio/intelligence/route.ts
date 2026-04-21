import { NextResponse } from "next/server";
import { buildPortfolioIntelligence, runOptimizationAndPersist } from "@/modules/portfolio/portfolio-intelligence.service";
import type { ObjectiveMode } from "@/modules/portfolio/portfolio.types";
import { requirePortfolioSession } from "../_auth";
import { isLecipmPhaseEnabled, logRolloutGate, portfolioIntelligenceWhenRolloutDisabled } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

const OBJECTIVES: ObjectiveMode[] = [
  "RISK_REDUCTION",
  "CASHFLOW_STABILITY",
  "ESG_ADVANCEMENT",
  "COMPLIANCE_CLEANUP",
  "CAPITAL_EFFICIENCY",
  "BALANCED",
];

export async function GET() {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  if (!isLecipmPhaseEnabled(6)) {
    logRolloutGate(6, "/api/portfolio/intelligence GET");
    return NextResponse.json(portfolioIntelligenceWhenRolloutDisabled());
  }

  try {
    const body = await buildPortfolioIntelligence(auth.userId, auth.role);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Unable to load portfolio intelligence" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  if (!isLecipmPhaseEnabled(6)) {
    logRolloutGate(6, "/api/portfolio/intelligence POST");
    return NextResponse.json({
      ...portfolioIntelligenceWhenRolloutDisabled(),
      optimizationSkipped: true as const,
    });
  }

  let objectiveMode: ObjectiveMode = "BALANCED";
  try {
    const json = await req.json().catch(() => ({}));
    const raw = typeof json?.objectiveMode === "string" ? json.objectiveMode : "";
    if (OBJECTIVES.includes(raw as ObjectiveMode)) objectiveMode = raw as ObjectiveMode;
  } catch {
    objectiveMode = "BALANCED";
  }

  try {
    const result = await runOptimizationAndPersist({
      userId: auth.userId,
      role: auth.role,
      objectiveMode,
    });
    return NextResponse.json({
      runId: result.runId,
      summary: result.summary,
      assetStrategies: result.assetStrategies,
      allocationProposal: result.allocationProposal,
    });
  } catch {
    return NextResponse.json({ error: "Optimization run failed" }, { status: 500 });
  }
}
