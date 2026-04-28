import { getDemoKnowledgeContextBlock } from "@/lib/demo/demo-knowledge";

export const dynamic = "force-dynamic";

const MAX_QUESTION_LEN = 600;

function sanitizeQuestion(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUESTION_LEN)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  if (process.env.DEMO_QA_AI_ENABLED?.trim().toLowerCase() !== "true") {
    return Response.json({ ok: false, message: "Demo QA AI disabled" }, { status: 503 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ ok: false, message: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const rawQ =
    typeof body === "object" &&
    body !== null &&
    "question" in body &&
    typeof (body as { question: unknown }).question === "string"
      ? (body as { question: string }).question
      : "";

  const question = sanitizeQuestion(rawQ);
  if (!question) {
    return Response.json({ ok: false, message: "question required" }, { status: 400 });
  }

  const knowledgeBlock = getDemoKnowledgeContextBlock();

  const system = [
    "You are a concise assistant for the SYBNB investor demo on Darlink.",
    "Answer ONLY using demo-safe information from the DEMO KNOWLEDGE section below.",
    "Never mention API keys, passwords, tokens, database URLs, internal hostnames, real customer records, or unreleased product specifics.",
    "If the question is outside this knowledge, refuse briefly and list which demo topics you can discuss.",
    "",
    "DEMO KNOWLEDGE:",
    knowledgeBlock,
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEMO_QA_AI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[demo-qa]", res.status, errText.slice(0, 300));
      return Response.json({ ok: false, message: "AI unavailable" }, { status: 502 });
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return Response.json({ ok: false, message: "Empty AI response" }, { status: 502 });
    }

    return Response.json({ ok: true, answer: text });
  } catch (e) {
    console.error("[demo-qa]", e instanceof Error ? e.message : e);
    return Response.json({ ok: false, message: "AI request failed" }, { status: 502 });
  }
}
