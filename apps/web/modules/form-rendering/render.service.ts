import type { Deal } from "@prisma/client";
import { buildPackagePrefill } from "@/modules/form-mapping/package-prefill.service";
import type { DraftExportBundle } from "./rendering.types";

const GLOBAL_DISCLAIMER =
  "Draft assistance only. Official OACIQ mandatory forms must be completed and reviewed by the broker of record. This output is not a filed instrument.";

/**
 * Safe intermediate: JSON draft bundle for broker review — no PDF impersonation of official forms.
 */
export function renderDealDraftBundle(deal: Deal, templateKey: string): DraftExportBundle {
  const prefill = buildPackagePrefill(deal, templateKey);
  return {
    dealId: deal.id,
    generatedAt: new Date().toISOString(),
    isDraftAssistance: true,
    brokerReviewRequired: true,
    globalDisclaimer: GLOBAL_DISCLAIMER,
    sections: [
      {
        templateKey,
        label: "Structured field preview (mapped from deal record)",
        structuredPreview: {
          mappedFields: prefill.mappedFields,
          missingRequiredFields: prefill.missingRequiredFields,
          warnings: prefill.warnings,
        },
        disclaimer: "Mapped fields are assistance only — verify against the current official form version.",
      },
    ],
  };
}
