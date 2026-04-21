import type { CentrisStructuredExport, GeneratedListingContent } from "@/modules/listing-assistant/listing-assistant.types";

/** Centris-ready structured payload — paste only; never auto-posted by LECIPM. */
export function buildCentrisStructuredExport(content: GeneratedListingContent): CentrisStructuredExport {
  return {
    title: content.title,
    description: content.description,
    features: [...content.propertyHighlights],
    amenities: [...content.amenities],
    zoning: content.zoningNotes,
    disclaimers: content.disclaimers.join("\n\n"),
  };
}

export function formatCentrisExportJson(payload: CentrisStructuredExport): string {
  return JSON.stringify(payload, null, 2);
}

/** Plain text blocks for rapid paste into external boards (manual only). */
export function formatCopyReadyCentrisText(payload: CentrisStructuredExport): string {
  return [
    `TITLE\n${payload.title}`,
    "",
    `DESCRIPTION\n${payload.description}`,
    "",
    `FEATURES\n${payload.features.map((f) => `• ${f}`).join("\n")}`,
    "",
    `AMENITIES\n${payload.amenities.map((a) => `• ${a}`).join("\n")}`,
    "",
    `ZONING\n${payload.zoning}`,
    "",
    `DISCLAIMERS\n${payload.disclaimers}`,
  ].join("\n");
}
