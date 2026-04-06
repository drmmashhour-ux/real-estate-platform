import type { E2EFailureContext, E2EFailureSeverity, E2EFailureType } from "./types";

function severityForType(t: E2EFailureType): E2EFailureSeverity {
  switch (t) {
    case "stripe_webhook":
    case "db_consistency":
    case "booking_transition":
      return "critical";
    case "stripe_checkout":
    case "manual_payment":
    case "permission_error":
    case "market_resolution":
      return "high";
    case "rtl_layout":
    case "missing_translation":
    case "ai_locale_mismatch":
    case "notification_error":
      return "medium";
    case "infra_blocked":
      return "low";
    default:
      return "high";
  }
}

/**
 * Deterministic classification from captured context + aggregated error text.
 */
export function classifyFailure(ctx: E2EFailureContext): { type: E2EFailureType; severity: E2EFailureSeverity } {
  const hay = [
    ctx.errorMessage,
    ctx.logSnippet ?? "",
    ctx.apiBodySnippet ?? "",
    ...(ctx.stepName ? [ctx.stepName] : []),
  ]
    .join(" ")
    .toLowerCase();

  if (/econnrefused|err_connection|not reachable|blocked.*app/i.test(hay)) {
    return { type: "infra_blocked", severity: severityForType("infra_blocked") };
  }

  if (ctx.locale === "ar" && (/rtl|dir=|horizontal overflow|layout break/i.test(hay) || /dir/i.test(ctx.stepName))) {
    return { type: "rtl_layout", severity: severityForType("rtl_layout") };
  }

  if (
    /\bt\(['"][\w.:]+['"]\)|missing translation|translation key|i18n\.|locale\.json/i.test(hay) ||
    /missing_translation/i.test(hay)
  ) {
    return { type: "missing_translation", severity: severityForType("missing_translation") };
  }

  if (/stripe.*webhook|webhook.*signature|checkout\.session\.completed/i.test(hay)) {
    return { type: "stripe_webhook", severity: severityForType("stripe_webhook") };
  }

  if (/stripe.*checkout|\/api\/stripe\/checkout|session.*create/i.test(hay)) {
    return { type: "stripe_checkout", severity: severityForType("stripe_checkout") };
  }

  if (/manual.payment|manual-payment|manualpayment|awaiting_manual|settlement/i.test(hay)) {
    return { type: "manual_payment", severity: severityForType("manual_payment") };
  }

  if (/forbidden|403|unauthorized|401|not allowed|permission/i.test(hay)) {
    return { type: "permission_error", severity: severityForType("permission_error") };
  }

  if (
    /syria|market|onlinepayments|contact.first|activemarket/i.test(hay) &&
    (ctx.scenarioSlug.includes("syria") || ctx.scenarioSlug.includes("mixed") || ctx.market === "syria")
  ) {
    return { type: "market_resolution", severity: severityForType("market_resolution") };
  }

  if (
    (ctx.scenarioSlug.includes("ai") || /autopilot|recommendation/i.test(hay)) &&
    /locale|language|mismatch|fr|ar|en/i.test(hay)
  ) {
    return { type: "ai_locale_mismatch", severity: severityForType("ai_locale_mismatch") };
  }

  if (/notification|email.*fail|push.*fail/i.test(hay)) {
    return { type: "notification_error", severity: severityForType("notification_error") };
  }

  if (/booking.*status|transition|confirmed|pending|awaiting_host/i.test(hay)) {
    return { type: "booking_transition", severity: severityForType("booking_transition") };
  }

  if (/prisma|constraint|unique|null|inconsistent|db /i.test(hay)) {
    return { type: "db_consistency", severity: severityForType("db_consistency") };
  }

  if (ctx.apiStatusCode != null && ctx.apiStatusCode >= 400) {
    return { type: "api_error", severity: severityForType("api_error") };
  }

  if (/locale|lang=|mi_locale|french|arabic/i.test(hay) && /ui|copy|text/i.test(hay)) {
    return { type: "ui_localization", severity: severityForType("ui_localization") };
  }

  return { type: "unknown", severity: "medium" };
}
