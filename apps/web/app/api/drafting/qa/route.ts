import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveDraftingContextForForm } from "@/lib/ai/retrieve-drafting-context";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  formType: z.string().min(1),
  question: z.string().min(1),
});

async function answerFromPassages(question: string, passages: { sourceKey: string; content: string }[]): Promise<string | null> {
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
          "Answer drafting questions using only the passages. If the passages do not support an answer, say manual broker review is required. Do not invent OACIQ rules.",
      },
      {
        role: "user",
        content: `Question:\n${question}\n\nPassages:\n${block}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? null;
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const passages = await retrieveDraftingContextForForm({
    formType: body.formType,
    query: body.question,
  });

  if (!passages.length) {
    return NextResponse.json({
      success: false,
      answer: null,
      passages: [],
      warning: "No approved sources retrieved.",
    });
  }

  const answer = await answerFromPassages(body.question, passages);

  return NextResponse.json({
    success: true,
    answer: answer ?? "Manual review required — model unavailable or passages only (see `passages`).",
    passages,
    modelUsed: Boolean(answer && isOpenAiConfigured()),
  });
}
