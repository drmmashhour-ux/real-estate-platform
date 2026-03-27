import { NextRequest, NextResponse } from "next/server";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { demoSteps } from "@/lib/demo-steps";

export const dynamic = "force-dynamic";

const FALLBACK: Record<string, string> = {
  welcome: "This is your home base — use the top navigation and search to explore the platform.",
  search: "Here you can search for properties by location, dates, and guest count — results open in the stays search hub.",
  listing: "Listing pages show photos, price context, and actions like contacting a broker.",
  contact: "Use Contact broker to reach a licensed professional about this property — the assistant can qualify your request first.",
  offer: "Offers are handled in the transaction flow after you’re signed in and working with a broker on a specific deal.",
  profile: "Your investor profile powers project matches, alerts, and personalized rankings.",
};

/** POST /api/demo/ai-help — short explanation for the current guided-demo step (staging). */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    return NextResponse.json({ explanation: "" }, { status: 200 });
  }

  let body: { stepId?: string };
  try {
    body = (await req.json()) as { stepId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId.trim() : "";
  const step = demoSteps.find((s) => s.id === stepId);
  const title = step?.title ?? "This step";
  const desc = step?.description ?? "";

  if (!isOpenAiConfigured()) {
    return NextResponse.json({
      explanation: FALLBACK[stepId] ?? `${title}: ${desc}`,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You help first-time users in one short sentence (max 35 words). Plain English. No PII. Real-estate platform demo.",
        },
        {
          role: "user",
          content: `Step "${title}". Hint: ${desc}. Say what to do here in one sentence.`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return NextResponse.json({
      explanation: text || FALLBACK[stepId] || `${title}: ${desc}`,
    });
  } catch {
    return NextResponse.json({
      explanation: FALLBACK[stepId] ?? `${title}: ${desc}`,
    });
  }
}
