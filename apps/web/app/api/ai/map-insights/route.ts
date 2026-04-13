import { NextRequest, NextResponse } from "next/server";
import { buildRuleBasedMapInsight, type MapInsightStats } from "@/lib/ai/map-search-insights";
import { logAiEvent } from "@/lib/ai/log";
import { logError } from "@/lib/logger";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function parseStats(raw: unknown): MapInsightStats | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const count = num(o.count);
  if (count < 1) return null;
  return {
    count,
    medianPrice: num(o.medianPrice),
    minPrice: num(o.minPrice),
    maxPrice: num(o.maxPrice),
    soldCount: num(o.soldCount),
    pendingCount: num(o.pendingCount),
    activeCount: num(o.activeCount),
  };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const dealKind = body.dealKind === "rent" ? "rent" : "sale";
  const city = typeof body.city === "string" ? body.city : undefined;
  const userQuestion = typeof body.userQuestion === "string" ? body.userQuestion.trim().slice(0, 500) : "";
  const stats = parseStats(body.stats);
  if (!stats) {
    return NextResponse.json({ ok: false, error: "Missing or invalid stats" }, { status: 400 });
  }

  const fallback = buildRuleBasedMapInsight(stats, dealKind, city);

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    logAiEvent("map_search_insight", { source: "rules", reason: "no_openai" });
    return NextResponse.json({ ok: true, source: "rules" as const, text: fallback });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a concise real-estate search assistant for Quebec/Canada. " +
            "You only receive aggregate statistics for listings visible on a map (counts, median/min/max price, how many sold vs active). " +
            "Write 2 short paragraphs (max 6 sentences total). " +
            "Help the buyer or renter interpret the median, spread, and mix of sold vs active listings. " +
            "Suggest practical next steps (narrow filters, compare above/below median, verify status with a broker). " +
            "Never invent specific addresses or prices not in the JSON. " +
            "No investment guarantees. Plain text only, no markdown headings.",
        },
        {
          role: "user",
          content: JSON.stringify({
            dealKind,
            city: city ?? null,
            stats,
            userQuestion: userQuestion || null,
          }),
        },
      ],
    });

    const text = (completion.choices[0]?.message?.content ?? "").trim();
    if (text.length >= 80) {
      logAiEvent("map_search_insight", { source: "openai" });
      return NextResponse.json({ ok: true, source: "openai" as const, text });
    }
  } catch (e) {
    logError("POST /api/ai/map-insights openai", e);
  }

  logAiEvent("map_search_insight", { source: "rules", reason: "fallback" });
  return NextResponse.json({ ok: true, source: "rules" as const, text: fallback });
}
