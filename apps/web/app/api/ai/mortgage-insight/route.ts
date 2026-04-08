import { NextRequest, NextResponse } from "next/server";
import { buildRuleBasedMortgageInsight, type MortgageInsightInput } from "@/lib/ai/mortgage-insight-narrative";
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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const input: MortgageInsightInput = {
    propertyPrice: num(body.propertyPrice),
    downPayment: num(body.downPayment),
    annualIncome: num(body.annualIncome),
    estimatedApprovalAmount: num(body.estimatedApprovalAmount),
    approvalConfidence: typeof body.approvalConfidence === "string" ? body.approvalConfidence : "low",
  };

  if (!(input.estimatedApprovalAmount > 0) || !(input.annualIncome > 0)) {
    return NextResponse.json({ ok: false, error: "Missing income or estimate" }, { status: 400 });
  }

  const fallback = buildRuleBasedMortgageInsight(input);

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    logAiEvent("mortgage_insight", { source: "rules", reason: "no_openai" });
    return NextResponse.json({ ok: true, source: "rules" as const, text: fallback });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You help Canadian homebuyers understand rough mortgage scenarios. Write one short paragraph (3-4 sentences). " +
            "Professional, plain language, warm tone. Use only the numbers given. " +
            "Mention estimated purchasing power range and whether a higher down payment could help if down payment is under 20%. " +
            "Do not promise approval. No JSON — plain text only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            propertyPrice: input.propertyPrice,
            downPayment: input.downPayment,
            annualIncome: input.annualIncome,
            estimatedApprovalAmount: input.estimatedApprovalAmount,
            approvalConfidence: input.approvalConfidence,
          }),
        },
      ],
    });

    const text = (completion.choices[0]?.message?.content ?? "").trim();
    if (text.length >= 60) {
      logAiEvent("mortgage_insight", { source: "openai" });
      return NextResponse.json({ ok: true, source: "openai" as const, text });
    }
  } catch (e) {
    logError("POST /api/ai/mortgage-insight openai", e);
  }

  logAiEvent("mortgage_insight", { source: "rules", reason: "fallback" });
  return NextResponse.json({ ok: true, source: "rules" as const, text: fallback });
}
