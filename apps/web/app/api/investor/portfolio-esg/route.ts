import { NextResponse } from "next/server";
import { runPortfolioEsgAnalysis } from "@/modules/investor-esg/portfolio-esg.engine";
import type { PortfolioPropertyInput } from "@/modules/investor-esg/portfolio.types";

export const dynamic = "force-dynamic";

/**
 * POST — portfolio-level ESG aggregation (internal analytical metric only).
 * Body: { properties: [{ id, label?, esgScore, propertyValue }] }
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.properties;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Expected properties array" }, { status: 400 });
  }

  const properties: PortfolioPropertyInput[] = raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((p) => ({
      id: typeof p.id === "string" ? p.id : "",
      label: typeof p.label === "string" ? p.label : undefined,
      esgScore: typeof p.esgScore === "number" ? p.esgScore : Number(p.esgScore) || 0,
      propertyValue: typeof p.propertyValue === "number" ? p.propertyValue : Number(p.propertyValue) || 0,
    }))
    .filter((p) => p.id.length > 0);

  const result = runPortfolioEsgAnalysis(properties);

  return NextResponse.json(result);
}
