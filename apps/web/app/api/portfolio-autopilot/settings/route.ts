import { NextResponse } from "next/server";
import {
  getOrCreatePortfolioAutopilotSettings,
  updatePortfolioAutopilotSettings,
} from "@/lib/portfolio-autopilot/get-portfolio-settings";
import { requirePortfolioOwnerOrAdmin } from "@/lib/portfolio-autopilot/portfolio-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("ownerUserId");
  const gate = await requirePortfolioOwnerOrAdmin({ targetOwnerUserId: target });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const row = await getOrCreatePortfolioAutopilotSettings(gate.effectiveOwnerId);
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown> & { ownerUserId?: string };
  const gate = await requirePortfolioOwnerOrAdmin({
    targetOwnerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : undefined,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const allowedKeys = [
    "mode",
    "autoRunListingOptimization",
    "autoGenerateContentForTopListings",
    "autoFlagWeakListings",
    "allowPriceRecommendations",
  ] as const;
  const data: Partial<Record<(typeof allowedKeys)[number], unknown>> = {};
  for (const k of allowedKeys) {
    if (k in body) data[k] = body[k];
  }

  const row = await updatePortfolioAutopilotSettings(
    gate.effectiveOwnerId,
    data as Parameters<typeof updatePortfolioAutopilotSettings>[1]
  );
  return NextResponse.json(row);
}
