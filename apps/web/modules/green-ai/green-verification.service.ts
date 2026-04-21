import type { GreenVerificationLevel } from "./green.types";
import { verificationLog } from "./green-ai-logger";

const DOC_SIGNAL_KINDS = new Set([
  "energy_audit",
  "energuide",
  "renovation_invoice",
  "hvac_invoice",
  "window_invoice",
  "insulation_invoice",
  "solar_invoice",
  "utility_bill_sample",
  "other_supporting_pdf",
]);

export type DocumentRefInput = {
  kind?: string;
  uploadedAtIso?: string;
};

/**
 * DOCUMENT_SUPPORTED when user attached identifiable proof categories; else AI_ESTIMATED.
 * PROFESSIONAL_VERIFIED reserved for future partner workflow.
 */
export function resolveVerificationLevel(args: {
  documents: DocumentRefInput[];
  persistedLevel?: string | null;
}): GreenVerificationLevel {
  if (args.persistedLevel === "PROFESSIONAL_VERIFIED") return "PROFESSIONAL_VERIFIED";

  const hasDoc =
    args.documents.some((d) => {
      const k = (d.kind ?? "").toLowerCase();
      return DOC_SIGNAL_KINDS.has(k);
    }) ||
    args.documents.some((d) => Boolean(d.uploadedAtIso) && String(d.kind ?? "").length > 0);

  const level: GreenVerificationLevel = hasDoc ? "DOCUMENT_SUPPORTED" : "AI_ESTIMATED";
  verificationLog.info("verification_level_resolved", { level, docCount: args.documents.length });
  return level;
}
