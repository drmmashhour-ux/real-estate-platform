import type { DraftExportBundle } from "./rendering.types";

/** Serializes bundle for download — still marked draft; broker must export official PDFs separately. */
export function serializeDraftBundleJson(bundle: DraftExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function exportFilename(dealId: string): string {
  return `lecipm-draft-assistance-${dealId.slice(0, 8)}.json`;
}
