import type { CreateGeneratedContentDraftInput } from "../dao";
import type { GenerateContentInput, MarketContentConstraints } from "../types";
import { buildMarketConstraintAppendix, notificationCopySystemPreamble } from "../templates";
import { translateServer } from "@/lib/i18n/server-translate";

/** Draft in-app / push style copy (never auto-send). */
export function buildNotificationDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  const topic = String(input.entity.topic ?? input.entity.event ?? "update");
  const title = translateServer(input.locale, "contentEngine.template.notificationTitle", { topic });
  const line = translateServer(input.locale, "contentEngine.template.notificationBody", { topic });

  const body = [notificationCopySystemPreamble(input.locale), "", line, "", buildMarketConstraintAppendix(input.locale, constraints)].join(
    "\n",
  );

  return {
    surface: "notification",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "system",
    entityId: null,
    title,
    body,
    summary: line,
    seoTitle: null,
    seoDescription: null,
    generationSource: "template",
    createdBySystem: true,
    metadata: { generator: "notification-copy", topic },
    statusOverride: "pending_review",
  };
}
