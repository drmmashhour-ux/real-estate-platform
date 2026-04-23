import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPortfolioPrompt } from "@/lib/ai/portfolio";
import { computePortfolio } from "@/lib/investor/portfolio";
import { prisma } from "@/lib/db";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { requireUser } from "@/modules/security/access-guard.service";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  portfolioId: z.string().min(1),
});

const MODEL = process.env.PORTFOLIO_AI_MODEL?.trim() || "gpt-4o-mini";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const book = await prisma.portfolioBook.findFirst({
    where: { id: parsed.data.portfolioId, ownerUserId: auth.userId },
  });
  if (!book) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const portfolio = await computePortfolio(parsed.data.portfolioId);
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const input = {
    properties: portfolio.properties,
    totalValue: portfolio.totalValueCents / 100,
    totalCashflow: portfolio.totalCashflowCents / 100,
  };

  const prompt = buildPortfolioPrompt(input);

  let analysis: Record<string, unknown> | null = null;
  const client = openai;
  if (isOpenAiConfigured() && client) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.25,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return only JSON with keys: summary (string), strengths (string[]), weaknesses (string[]), optimizationSuggestions (string[]). No guaranteed returns.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (raw) {
      analysis = JSON.parse(raw) as Record<string, unknown>;
    }
  }

  await recordAuditEvent({
    actorUserId: auth.userId,
    action: "PORTFOLIO_AI_ANALYSIS_RUN",
    payload: { portfolioId: parsed.data.portfolioId, openAi: Boolean(analysis) },
  });

  return NextResponse.json({
    success: true,
    prompt,
    analysis,
    fallback: analysis ? null : "Set OPENAI_API_KEY for JSON analysis output.",
  });
}
