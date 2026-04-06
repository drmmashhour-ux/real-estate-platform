import type { CreateGeneratedContentDraftInput } from "../dao";
import { assertNoFabricatedClaims } from "../policies";
import type { GenerateContentInput, MarketContentConstraints } from "../types";
import { buildMarketConstraintAppendix, hostCopySystemPreamble } from "../templates";
import { translateServer } from "@/lib/i18n/server-translate";

function listingId(entity: Record<string, unknown>): string | null {
  const id = entity.id ?? entity.listingId;
  return typeof id === "string" ? id : null;
}

/** Host-facing recommendation + “why guests love” style block (template-only). */
export function buildHostRecommendationDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  assertNoFabricatedClaims(input);
  const city = String(input.entity.city ?? "");
  const title = String(input.entity.title ?? input.entity.listingTitle ?? "");
  const amenities = Array.isArray(input.entity.amenities) ? (input.entity.amenities as string[]).slice(0, 12) : [];
  const amenityLine =
    amenities.length > 0
      ? translateServer(input.locale, "contentEngine.template.hostAmenitiesLine", {
          list: amenities.join(", "),
        })
      : translateServer(input.locale, "contentEngine.template.hostNoAmenitiesLine");

  const body = [
    hostCopySystemPreamble(input.locale),
    "",
    translateServer(input.locale, "contentEngine.template.hostWhyGuests", { title: title || city || "—" }),
    "",
    amenityLine,
    "",
    buildMarketConstraintAppendix(input.locale, constraints),
  ].join("\n");

  return {
    surface: "host_recommendation",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "listing",
    entityId: listingId(input.entity),
    title: translateServer(input.locale, "contentEngine.template.hostRecTitle"),
    body,
    summary: null,
    seoTitle: null,
    seoDescription: null,
    generationSource: "template",
    createdBySystem: true,
    hostOverwritePolicy: "append_suggestion",
    metadata: { tone: input.tone, generator: "host-copy" },
    statusOverride: "draft",
  };
}
