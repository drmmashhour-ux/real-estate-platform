import type { ContentLocale, GenerateContentInput, MarketContentConstraints } from "./types";
import { translateServer } from "@/lib/i18n/server-translate";

const PROMPT_VERSION = "content-engine-v1";

export function getPromptVersion(): string {
  return PROMPT_VERSION;
}

/**
 * System-side template fragments (locale-aware via translateServer).
 * Actual LLM user prompts are assembled in generators; keep market rules in constraints.
 */
export function buildMarketConstraintAppendix(
  locale: ContentLocale,
  constraints: MarketContentConstraints,
): string {
  if (!constraints.contactFirst && constraints.onlinePaymentsEnabled) {
    return translateServer(locale, "contentEngine.constraints.standardMarket");
  }
  if (constraints.contactFirst || constraints.manualPaymentEmphasis) {
    return translateServer(locale, "contentEngine.constraints.contactFirstMarket");
  }
  return translateServer(locale, "contentEngine.constraints.standardMarket");
}

export function listingSeoSystemPreamble(locale: ContentLocale): string {
  return translateServer(locale, "contentEngine.prompts.listingSeoSystem");
}

export function cityPageSystemPreamble(locale: ContentLocale): string {
  return translateServer(locale, "contentEngine.prompts.cityPageSystem");
}

export function hostCopySystemPreamble(locale: ContentLocale): string {
  return translateServer(locale, "contentEngine.prompts.hostCopySystem");
}

export function notificationCopySystemPreamble(locale: ContentLocale): string {
  return translateServer(locale, "contentEngine.prompts.notificationCopySystem");
}

/** Template-only body assembly when AI is off — still creates auditable draft text */
export function templateListingSeoDraft(input: GenerateContentInput): { title: string; description: string } {
  const city = String(input.entity.city ?? input.entity.cityName ?? "");
  const neighborhood = String(input.entity.neighborhood ?? "");
  const type = String(input.entity.propertyType ?? "stay");
  const base = [city, neighborhood, type].filter(Boolean).join(" · ");
  return {
    title: base.slice(0, 200) || "Listing",
    description: translateServer(input.locale, "contentEngine.template.listingSeoDescriptionFallback", {
      place: base || translateServer(input.locale, "contentEngine.template.genericPlace"),
    }),
  };
}
