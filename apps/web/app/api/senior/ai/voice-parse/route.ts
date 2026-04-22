import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { parseVoiceSnippet } from "@/modules/senior-living/ai/senior-intent.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });

  try {
    const parsed = parseVoiceSnippet(text);
    return NextResponse.json({ parsed, spokenSummary: simpleVoiceSummary(parsed) });
  } catch (e) {
    logError("[api.senior.ai.voice-parse]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

function simpleVoiceSummary(p: {
  preferredCity: string | null;
  budgetMonthly: number | null;
}): string {
  const parts: string[] = [];
  if (p.preferredCity) parts.push(`in ${p.preferredCity}`);
  if (p.budgetMonthly) parts.push(`around $${Math.round(p.budgetMonthly)} per month`);
  if (parts.length === 0) return "I noted what you said — you can tap a few choices to refine.";
  return `I found a few good options ${parts.join(" and ")} that match what you described.`;
}
