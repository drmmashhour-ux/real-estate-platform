import { NextRequest, NextResponse } from "next/server";
import {
  buildRuleBasedInvestmentInsight,
  type InvestmentInsightInput,
} from "@/lib/ai/investment-insight-narrative";
import { logAiEvent } from "@/lib/ai/log";
import { logError } from "@/lib/logger";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseJsonObject(raw: string): { summary?: string; suggestions?: unknown } | null {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fence ? fence[1]!.trim() : t;
  try {
    const o = JSON.parse(jsonStr) as { summary?: string; suggestions?: unknown };
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

function normalizeSuggestions(s: unknown): string[] {
  if (!Array.isArray(s)) return [];
  return s
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, 3);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const input: InvestmentInsightInput = {
    city: typeof body.city === "string" && body.city.trim() ? body.city.trim() : "your market",
    propertyPrice: num(body.propertyPrice),
    monthlyRentLongTerm: num(body.monthlyRentLongTerm),
    monthlyExpenses: num(body.monthlyExpenses),
    nightlyRate: num(body.nightlyRate),
    occupancyPercent: num(body.occupancyPercent),
    roiLongTerm: num(body.roiLongTerm),
    roiShortTerm: num(body.roiShortTerm),
    roiPreferred: num(body.roiPreferred),
    monthlyCashFlow: num(body.monthlyCashFlow),
    shortTermWinsOnRoi: Boolean(body.shortTermWinsOnRoi),
  };

  const fallback = buildRuleBasedInvestmentInsight(input);

  if (!isOpenAiConfigured()) {
    logAiEvent("investment_insight", { source: "rules", reason: "no_openai" });
    return NextResponse.json({
      ok: true,
      source: "rules" as const,
      summary: fallback.summary,
      suggestions: fallback.suggestions,
    });
  }

  try {
    const userPayload = JSON.stringify({
      city: input.city,
      propertyPrice: input.propertyPrice,
      monthlyRentLongTerm: input.monthlyRentLongTerm,
      monthlyExpenses: input.monthlyExpenses,
      nightlyRate: input.nightlyRate,
      occupancyPercent: input.occupancyPercent,
      roiLongTerm: input.roiLongTerm,
      roiShortTerm: input.roiShortTerm,
      roiPreferred: input.roiPreferred,
      monthlyCashFlow: input.monthlyCashFlow,
      shortTermWinsOnRoi: input.shortTermWinsOnRoi,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content:
            "You are a Canadian real estate investment advisor. Write clear, professional copy that sounds human — not robotic. " +
            "Use ONLY the numbers provided. Do not invent facts. " +
            "Respond with valid JSON only: {\"summary\":\"2-3 sentences\",\"suggestions\":[\"up to 3 short tips\"]}. " +
            "If ROI (roiPreferred) is under 5%, include a suggestion about price or rent. " +
            "If shortTermWinsOnRoi is true, acknowledge short-term can lift returns but adds risk. " +
            "If false, note long-term stability when appropriate.",
        },
        {
          role: "user",
          content: `Investment scenario (JSON): ${userPayload}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseJsonObject(raw);
    const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
    const suggestions = normalizeSuggestions(parsed?.suggestions);

    if (summary.length >= 40 && suggestions.length >= 1) {
      logAiEvent("investment_insight", { source: "openai", city: input.city });
      return NextResponse.json({
        ok: true,
        source: "openai" as const,
        summary,
        suggestions,
      });
    }
  } catch (e) {
    logError("POST /api/ai/investment-insight openai", e);
  }

  logAiEvent("investment_insight", { source: "rules", reason: "fallback" });
  return NextResponse.json({
    ok: true,
    source: "rules" as const,
    summary: fallback.summary,
    suggestions: fallback.suggestions,
  });
}
