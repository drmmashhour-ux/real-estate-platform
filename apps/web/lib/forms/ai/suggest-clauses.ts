import { prisma } from "@/lib/db";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { getDraftingGuideSources } from "../sources/get-drafting-guide-sources";
import { appendLegalFormAudit } from "../audit";

const SYSTEM = `You assist Québec real estate brokers drafting clauses. 
Rules: Never invent facts. Use only CONTEXT_JSON. Output 1–3 short optional clauses as JSON array: [{"title","clause","sourceNote"}]. If insufficient context, return [].`;

export async function suggestClausesForDraft(args: { draftId: string; actorUserId: string; templateKey: string }) {
  const draft = await prisma.legalFormDraft.findUnique({
    where: { id: args.draftId },
    include: { template: true },
  });
  if (!draft) return { ok: false as const, error: "Draft not found" };

  const guides = await getDraftingGuideSources({ templateKey: args.templateKey });
  const fieldValues = draft.fieldValuesJson as Record<string, unknown>;

  await prisma.legalFormSuggestion.deleteMany({
    where: { draftId: args.draftId, suggestionType: "clause" },
  });

  const contextPayload = {
    fieldValues,
    guides: guides.map((g) => ({ title: g.title, ref: g.sourceRef })),
  };

  let clauses: { title: string; clause: string; sourceNote: string }[] = [];

  if (openai && isOpenAiConfigured()) {
    try {
      const res = await openai.chat.completions.create({
        model: process.env.LEGAL_FORM_AI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `CONTEXT_JSON:\n${JSON.stringify(contextPayload)}\n\nPropose optional clause snippets only if grounded.`,
          },
        ],
      });
      const text = res.choices[0]?.message?.content?.trim() ?? "[]";
      let parsed: unknown;
      try {
        parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "")) as unknown;
      } catch {
        parsed = [];
      }
      if (Array.isArray(parsed)) {
        clauses = parsed
          .filter(
            (x): x is { title: string; clause: string; sourceNote: string } =>
              typeof x === "object" &&
              x != null &&
              "clause" in x &&
              typeof (x as { clause: unknown }).clause === "string"
          )
          .map((x) => ({
            title: typeof x.title === "string" ? x.title : "Suggested clause",
            clause: x.clause,
            sourceNote:
              typeof x.sourceNote === "string"
                ? x.sourceNote
                : "Suggested clause — broker review required before export.",
          }));
      }
    } catch {
      clauses = [];
    }
  }

  if (clauses.length === 0) {
    clauses = [
      {
        title: "Financing — generic placeholder",
        clause:
          "[Broker to edit] This offer is conditional on financing satisfactory to the buyer, on terms acceptable to the buyer, until [date].",
        sourceNote: "Template placeholder — not legal advice; replace with licensed form text.",
      },
    ];
  }

  await prisma.legalFormSuggestion.createMany({
    data: clauses.map((c) => ({
      draftId: args.draftId,
      fieldKey: null,
      suggestionType: "clause",
      suggestedValue: `${c.title}\n\n${c.clause}`,
      sourceType: guides.length ? "draft_book" : "platform_data",
      sourceRef: guides[0]?.sourceRef ?? "fallback_clause_bank",
      confidence: 40,
      explanation: c.sourceNote,
    })),
  });

  await appendLegalFormAudit({
    draftId: args.draftId,
    actorUserId: args.actorUserId,
    eventType: "clause_suggested",
    metadata: { count: clauses.length },
  });

  return { ok: true as const, count: clauses.length };
}
