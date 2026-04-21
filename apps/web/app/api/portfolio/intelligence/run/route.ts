import { NextResponse } from "next/server";
import { runOptimizationAndPersist } from "@/modules/portfolio/portfolio-intelligence.service";
import type { ObjectiveMode } from "@/modules/portfolio/portfolio.types";
import { requirePortfolioSession } from "../../_auth";

export const dynamic = "force-dynamic";

const OBJECTIVES: ObjectiveMode[] = [
  "RISK_REDUCTION",
  "CASHFLOW_STABILITY",
  "ESG_ADVANCEMENT",
  "COMPLIANCE_CLEANUP",
  "CAPITAL_EFFICIENCY",
  "BALANCED",
];

/** Alias of `POST /api/portfolio/intelligence` — same audit + persistence behavior. */
export async function POST(req: Request) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

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
