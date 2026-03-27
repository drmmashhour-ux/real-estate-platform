import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildMarketAnalysis } from "@/lib/market/analysis-service";
import { cityToSlug } from "@/lib/market/slug";

export const dynamic = "force-dynamic";

type Role = "broker" | "investor" | "buyer";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseSource(input: string): "zillow" | "airbnb" | "manual" {
  const t = input.toLowerCase();
  if (t.includes("zillow.com")) return "zillow";
  if (t.includes("airbnb.") || t.includes("airbnb.com")) return "airbnb";
  return "manual";
}

function extractCityGuess(input: string): string {
  try {
    const u = new URL(input);
    const parts = u.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
    const cityToken = parts.find((p) => /^[a-zA-Z-]{3,}$/.test(p) && !p.match(/^\d+$/));
    if (cityToken) return cityToken.replace(/-/g, " ");
  } catch {
    // not a URL: treat as free-text address
  }
  const raw = input.trim();
  const chunks = raw.split(",").map((x) => x.trim()).filter(Boolean);
  if (chunks.length >= 2) return chunks[chunks.length - 2]!;
  return chunks[chunks.length - 1] || "Montreal";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const role = (body.role as Role | undefined) ?? "buyer";
  const propertyInput = String(body.propertyInput ?? "").trim();
  if (!propertyInput) {
    return NextResponse.json({ error: "propertyInput is required" }, { status: 400 });
  }

  const source = parseSource(propertyInput);
  const cityGuess = extractCityGuess(propertyInput);
  const city = cityGuess
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  let marketScore = 55;
  let confidence = 50;
  try {
    const market = await buildMarketAnalysis(city, "Residential");
    marketScore = market.marketScore;
    confidence = market.confidence;
  } catch {
    // keep fallback values for cities without market data
  }

  const roleBoost = role === "investor" ? 8 : role === "broker" ? 5 : 0;
  const trustScore = clamp(45 + confidence * 0.35 + roleBoost);
  const dealScore = clamp(35 + marketScore * 0.55 + (source === "airbnb" ? 4 : 0));
  const verdict =
    dealScore >= 72 && trustScore >= 65
      ? "strong_deal"
      : dealScore >= 55 && trustScore >= 50
        ? "needs_review"
        : "high_risk";

  await prisma.trafficEvent.create({
    data: {
      eventType: "analysis_event",
      path: "/onboarding",
      source: "onboarding",
      medium: "product",
      meta: { role, source, city, verdict } as object,
    },
  }).catch(() => {});

  return NextResponse.json({
    source,
    normalizedAddressOrUrl: propertyInput,
    city: cityToSlug(city)
      .split("-")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" "),
    trustScore,
    dealScore,
    verdict,
    summary:
      verdict === "strong_deal"
        ? "Strong opportunity based on current market signal and trust profile."
        : verdict === "needs_review"
          ? "Potentially good deal; verify numbers and legal details before moving."
          : "Higher risk profile; proceed with caution and deeper due diligence.",
    insights: [
      `Source detected: ${source.toUpperCase()}.`,
      `Market confidence around ${confidence}/100 in ${city}.`,
      "Use full analysis page after signup to unlock deeper ROI and scenario metrics.",
    ],
  });
}
