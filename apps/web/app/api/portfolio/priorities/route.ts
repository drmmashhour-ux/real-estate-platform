import { NextResponse } from "next/server";
import { buildPortfolioIntelligence } from "@/modules/portfolio/portfolio-intelligence.service";
import { requirePortfolioSession } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePortfolioSession();
  if (!auth.ok) return auth.response;

  try {
    const bundle = await buildPortfolioIntelligence(auth.userId, auth.role);
    return NextResponse.json({ priorities: bundle.priorities });
  } catch {
    return NextResponse.json({ error: "Unable to load priorities" }, { status: 500 });
  }
}
