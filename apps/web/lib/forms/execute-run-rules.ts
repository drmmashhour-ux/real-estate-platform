import { prisma } from "@/lib/db";
import { appendLegalFormAudit } from "./audit";
import { getPlatformContext } from "./sources/get-platform-context";
import { hasBlockingAlerts, runFormRules } from "./rules/run-form-rules";
import type { LegalFormSchemaDocument } from "./types";
import { replaceDraftAlerts } from "./persist-alerts";

export async function executeRunRulesForDraft(args: { draftId: string; actorUserId: string }) {
  const draft = await prisma.legalFormDraft.findUnique({
    where: { id: args.draftId },
    include: { template: true },
  });
  if (!draft) return { ok: false as const, error: "Draft not found" };

  const schema = draft.template.schemaJson as unknown as LegalFormSchemaDocument;
  const fieldValues = (draft.fieldValuesJson ?? {}) as Record<string, unknown>;
  const ctx = await getPlatformContext({
    brokerUserId: draft.brokerUserId,
    clientUserId: draft.clientUserId,
    listingId: draft.listingId,
  });
  const listingPriceCents = ctx?.listing?.priceCents ?? null;

  const result = runFormRules({
    schema,
    draftLanguage: draft.language,
    fieldValues,
    listingPriceCents,
  });

  await replaceDraftAlerts(args.draftId, result.alerts);

  const blocking = hasBlockingAlerts(result.alerts);
  await prisma.legalFormDraft.update({
    where: { id: args.draftId },
    data: {
      alertsJson: { alerts: result.alerts, details: result.details } as object,
      status: blocking ? "review_required" : draft.status === "exported" ? "exported" : "review_required",
    },
  });

  await appendLegalFormAudit({
    draftId: args.draftId,
    actorUserId: args.actorUserId,
    eventType: "alert_generated",
    metadata: { blocking, count: result.alerts.length },
  });

  return { ok: true as const, alerts: result.alerts, blocking };
}
