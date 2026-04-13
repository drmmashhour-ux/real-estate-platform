import { prisma } from "@/lib/db";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { appendLegalFormAudit } from "../audit";

export async function summarizeLegalDraft(args: { draftId: string; actorUserId: string }) {
  const draft = await prisma.legalFormDraft.findUnique({ where: { id: args.draftId } });
  if (!draft) return { ok: false as const, error: "Draft not found" };

  const fv = draft.fieldValuesJson as Record<string, unknown>;
  let summary: string;

  if (openai && isOpenAiConfigured()) {
    const res = await openai.chat.completions.create({
      model: process.env.LEGAL_FORM_AI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "Summarize field values for a broker: key obligations, deadlines, conditions, risks to verify. Use only FIELD_JSON. No legal validity claims. Bullet list.",
        },
        { role: "user", content: JSON.stringify(fv) },
      ],
    });
    summary =
      res.choices[0]?.message?.content?.trim() ??
      "Summary unavailable — review field values manually.";
  } else {
    summary = `Draft contains ${Object.keys(fv).length} populated fields. Review all entries before export. AI assistive only.`;
  }

  await prisma.legalFormDraft.update({
    where: { id: args.draftId },
    data: { aiSummary: summary },
  });

  await prisma.legalFormSuggestion.create({
    data: {
      draftId: args.draftId,
      fieldKey: null,
      suggestionType: "summary",
      suggestedValue: summary,
      sourceType: "platform_data",
      sourceRef: "summarize-draft",
      explanation: "Plain-language draft summary — broker must verify against the official form.",
    },
  });

  await appendLegalFormAudit({
    draftId: args.draftId,
    actorUserId: args.actorUserId,
    eventType: "summarized",
    metadata: {},
  });

  return { ok: true as const, summary };
}
