import { NextResponse } from "next/server";
import { buildPortfolioReportPack } from "@/modules/portfolio/portfolio-report.service";
import type { ObjectiveMode } from "@/modules/portfolio/portfolio.types";
import { requirePortfolioSession } from "../../_auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  let objectiveMode: ObjectiveMode | undefined;
  try {
    const json = await req.json().catch(() => ({}));
    if (typeof json?.objectiveMode === "string") objectiveMode = json.objectiveMode as ObjectiveMode;
  } catch {
    objectiveMode = undefined;
  }

  try {
    const pack = await buildPortfolioReportPack({
      userId: auth.userId,
      role: auth.role,
      objectiveMode,
    });
    return NextResponse.json(pack);
  } catch {
    return NextResponse.json({ error: "Unable to build report pack" }, { status: 500 });
  }
}
