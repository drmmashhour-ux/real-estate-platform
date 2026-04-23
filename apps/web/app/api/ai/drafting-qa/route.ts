import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveDraftingContext } from "@/lib/ai/retrieval";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(1),
});

async function answerFromPassages(
  question: string,
  passages: { sourceKey: string; content: string }[],
): Promise<string | null> {
  if (!isOpenAiConfigured() || !openai) return null;
  const block = passages
    .map((p, i) => `[${i + 1}] sourceKey=${p.sourceKey}\n${p.content.slice(0, 8000)}`)
    .join("\n\n");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Answer using only the passages. If they do not support a confident answer, say you cannot determine from the sources and recommend manual broker review. Do not invent OACIQ rules or fill gaps. Mark uncertainty clearly.",
      },
      {
        role: "user",
        content: `Question:\n${question}\n\nPassages:\n${block}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? null;
}

/**
 * Research Q&A over ingested PDF vectors (unscoped). No sources → 422.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const ranked = await retrieveDraftingContext(body.question);
    const sources = ranked.map((r) => ({
      sourceKey: r.sourceKey,
      content: r.content,
      confidence: r.weightedScore,
      title: r.title,
    }));
    const answer =
      (await answerFromPassages(
        body.question,
        ranked.map((r) => ({ sourceKey: r.sourceKey, content: r.content })),
      )) ?? "Based on retrieved sources — review passages below; enable OpenAI for a synthesized answer grounded in these chunks only.";

    return NextResponse.json({
      answer,
      sources,
      modelUsed: Boolean(isOpenAiConfigured() && openai),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "RETRIEVAL_FAILED";
    if (msg === "NO_SOURCE_CONTEXT_AVAILABLE") {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    throw e;
  }
}
