import { prisma } from "@/lib/db";
import { buildDigestPrompt } from "@/lib/ai/digest";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { buildDigestData } from "@/lib/digest/data";
import { assertNoGuaranteedOutcomeInDigest } from "@/lib/digest/safety";
import { sendEmailNotification } from "@/lib/notifications";

const MODEL = process.env.DIGEST_AI_MODEL?.trim() || "gpt-4o-mini";

export type DailyDigestAiShape = {
  summary: string;
  keyHighlights: string[];
  risks: string[];
  opportunities: string[];
  suggestedActions: string[];
  metrics: Record<string, unknown>;
};

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
    .filter((s) => s.length > 0);
}

function asMetrics(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseDigestJson(raw: string): DailyDigestAiShape {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    keyHighlights: asStringList(parsed.keyHighlights),
    risks: asStringList(parsed.risks),
    opportunities: asStringList(parsed.opportunities),
    suggestedActions: asStringList(parsed.suggestedActions),
    metrics: asMetrics(parsed.metrics),
  };
}

function buildFallbackDigest(
  data: Awaited<ReturnType<typeof buildDigestData>>
): DailyDigestAiShape {
  const m = data.meta;
  const { counts } = m;
  const incomplete = m.digestUsesIncompleteMarketData;
  const summary = incomplete
    ? `Briefing (${m.window.sinceIso.slice(0, 10)}–now): platform activity summarized from available data; market snapshots are partial — treat zone metrics as indicative only. Activity: ${counts.watchlistAlerts} watchlist alerts, ${counts.alertCandidates} alert queue items, ${counts.deals} deals, ${counts.buyBoxMatches} new saved searches, ${counts.watchlistAdds} watchlist adds.`
    : `Briefing (${m.window.sinceIso.slice(0, 10)}–now): ${counts.watchlistAlerts} watchlist alerts, ${counts.alertCandidates} alert queue items, ${counts.deals} deals, ${counts.buyBoxMatches} new saved searches, ${counts.watchlistAdds} watchlist adds, ${counts.marketZones} market zone rows sampled.`;

  const keyHighlights: string[] = [];
  if (counts.deals > 0) keyHighlights.push(`${counts.deals} deal(s) touched the pipeline in the window.`);
  if (counts.watchlistAlerts > 0) keyHighlights.push(`${counts.watchlistAlerts} watchlist alert(s) fired.`);
  if (counts.buyBoxMatches > 0) keyHighlights.push(`${counts.buyBoxMatches} saved search / buy-box style update(s).`);
  if (keyHighlights.length === 0) keyHighlights.push("No major automated signals in this window — review workflows and saved searches manually.");

  return {
    summary,
    keyHighlights,
    risks: incomplete
      ? ["Market zone coverage is thin or stale; do not rely on median metrics for pricing decisions without corroboration."]
      : [],
    opportunities: [],
    suggestedActions: [
      "Review unread watchlist alerts and highest-severity alert candidates.",
      "Confirm deal stages and next milestones for active pipeline rows.",
      "Skim latest market snapshot directions for your focus regions.",
    ],
    metrics: { fallback: true, counts },
  };
}

async function runDigestModel(prompt: string): Promise<DailyDigestAiShape> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1400,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON matching the user's schema. Never promise guaranteed investment outcomes.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    throw new Error("EMPTY_AI_DIGEST");
  }
  return parseDigestJson(raw);
}

function digestDateUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export type GenerateDailyDigestOptions = {
  sendEmail?: boolean;
};

export async function generateDailyDigest(
  ownerType: string,
  ownerId: string,
  options: GenerateDailyDigestOptions = {}
) {
  const data = await buildDigestData(ownerType, ownerId);
  const prompt = buildDigestPrompt(data);

  let ai: DailyDigestAiShape;
  try {
    ai = await runDigestModel(prompt);
  } catch (e) {
    if ((e as Error)?.message === "OPENAI_NOT_CONFIGURED") {
      ai = buildFallbackDigest(data);
    } else {
      throw e;
    }
  }

  assertNoGuaranteedOutcomeInDigest(ai);

  const dataQualityLabel = data.meta.digestUsesIncompleteMarketData
    ? "Platform + partial market data"
    : "Platform + market snapshots";

  const metrics: Record<string, unknown> = {
    ...ai.metrics,
    dataQualityLabel,
    digestUsesIncompleteMarketData: data.meta.digestUsesIncompleteMarketData,
    window: data.meta.window,
    counts: data.meta.counts,
  };

  const digest = await prisma.dailyDigest.create({
    data: {
      ownerType,
      ownerId,
      date: digestDateUtc(new Date()),
      summary: ai.summary ?? null,
      keyHighlights: ai.keyHighlights as object,
      risks: ai.risks as object,
      opportunities: ai.opportunities as object,
      suggestedActions: ai.suggestedActions as object,
      metrics: metrics as object,
    },
  });

  if (options.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { email: true },
    });
    if (user?.email) {
      const lines = [
        `<p>${escapeHtml(ai.summary)}</p>`,
        "<h2>Highlights</h2><ul>",
        ...ai.keyHighlights.map((h) => `<li>${escapeHtml(h)}</li>`),
        "</ul>",
        "<h2>Suggested actions</h2><ul>",
        ...ai.suggestedActions.map((h) => `<li>${escapeHtml(h)}</li>`),
        "</ul>",
        `<p style="color:#666;font-size:12px;">${escapeHtml(dataQualityLabel)}</p>`,
      ];
      void sendEmailNotification({
        to: user.email,
        subject: "Your Daily LECIPM Briefing",
        html: lines.join("\n"),
      });
    }
  }

  return digest;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
