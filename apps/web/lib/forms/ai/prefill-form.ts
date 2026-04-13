import { prisma } from "@/lib/db";
import type { LegalFormSchemaDocument } from "../types";
import { getPlatformContext, getValueFromContext } from "../sources/get-platform-context";
import { appendLegalFormAudit } from "../audit";

export async function prefillLegalFormDraft(args: { draftId: string; actorUserId: string }) {
  const draft = await prisma.legalFormDraft.findUnique({
    where: { id: args.draftId },
    include: { template: true },
  });
  if (!draft) return { ok: false as const, error: "Draft not found" };

  const schema = draft.template.schemaJson as unknown as LegalFormSchemaDocument;
  const ctx = await getPlatformContext({
    brokerUserId: draft.brokerUserId,
    clientUserId: draft.clientUserId,
    listingId: draft.listingId,
  });
  if (!ctx) return { ok: false as const, error: "Context unavailable" };

  await prisma.legalFormSuggestion.deleteMany({
    where: { draftId: args.draftId, suggestionType: "prefill" },
  });

  const current = (draft.fieldValuesJson ?? {}) as Record<string, unknown>;
  const merged = { ...current };
  const rows: {
    fieldKey: string | null;
    suggestedValue: string;
    explanation: string;
    confidence: number;
  }[] = [];

  for (const sec of schema.sections) {
    for (const field of sec.fields) {
      if (!field.aiPrefillEligible || !field.sourceMappings?.length) continue;
      if (current[field.id] !== undefined && current[field.id] !== null && current[field.id] !== "") {
        continue;
      }
      for (const map of field.sourceMappings) {
        const raw = getValueFromContext(ctx, map);
        if (raw === undefined || raw === null) continue;
        const str =
          typeof raw === "number" && field.type === "money_cents"
            ? String(raw)
            : typeof raw === "object"
              ? JSON.stringify(raw)
              : String(raw);
        merged[field.id] = field.type === "money_cents" ? Number(raw) : str;
        rows.push({
          fieldKey: field.id,
          suggestedValue: str,
          explanation: `AI prefill suggestion from platform data (mapping: ${map}). Review required before relying on this value.`,
          confidence: 85,
        });
        break;
      }
    }
  }

  if (rows.length) {
    await prisma.legalFormSuggestion.createMany({
      data: rows.map((r) => ({
        draftId: args.draftId,
        fieldKey: r.fieldKey,
        suggestionType: "prefill",
        suggestedValue: r.suggestedValue,
        sourceType: "platform_data",
        sourceRef: "getPlatformContext",
        confidence: r.confidence,
        explanation: r.explanation,
      })),
    });
  }

  await prisma.legalFormDraft.update({
    where: { id: args.draftId },
    data: {
      fieldValuesJson: merged as object,
      status: "review_required",
    },
  });

  await appendLegalFormAudit({
    draftId: args.draftId,
    actorUserId: args.actorUserId,
    eventType: "ai_prefill",
    metadata: { fieldsTouched: rows.map((r) => r.fieldKey) },
  });

  return { ok: true as const, filledFields: rows.length };
}
