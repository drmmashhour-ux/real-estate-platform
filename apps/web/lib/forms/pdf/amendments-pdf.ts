/**
 * Amendments form – PDF generation preparation.
 * Maps structured payload to a flat output object for future PDF fill/write.
 * Placeholder export logic until full fillable PDF writing is implemented.
 */

import type { AmendmentsPayload } from "../templates/amendments";

export type AmendmentsPdfOutput = {
  // M1
  principalFormType: string;
  principalFormOther: string;
  immovableAddress: string;
  // M2
  brokerageExpiryClause: string;
  brokerageExpiryDate: string;
  brokerageSalePriceClause: string;
  brokerageSalePrice: string;
  // M3
  acceptanceClause: string;
  acceptanceTime: string;
  acceptanceDate: string;
  // M4
  timePeriodClause: string;
  extendedDate: string;
  // M5
  otherAmendments: string;
  otherConditionsConfirmed: boolean;
  // M7 Buyer
  buyerAgencyRole: string;
  buyerSignedCity1: string;
  buyerSignedDate1: string;
  buyerSignedTime1: string;
  buyerSignature1: string;
  buyerWitness1: string;
  buyerSignedCity2: string;
  buyerSignedDate2: string;
  buyerSignedTime2: string;
  buyerSignature2: string;
  buyerWitness2: string;
  // M7 Seller
  sellerAgencyRole: string;
  sellerSignedCity1: string;
  sellerSignedDate1: string;
  sellerSignedTime1: string;
  sellerSignature1: string;
  sellerWitness1: string;
  sellerSignedCity2: string;
  sellerSignedDate2: string;
  sellerSignedTime2: string;
  sellerSignature2: string;
  sellerWitness2: string;
  // M7 Spouse
  spouseIntervention: string;
  spouseSignedCity: string;
  spouseSignedDate: string;
  spouseSignedTime: string;
  spouseSignature: string;
  spouseWitness: string;
};

const empty = (): AmendmentsPdfOutput => ({
  principalFormType: "",
  principalFormOther: "",
  immovableAddress: "",
  brokerageExpiryClause: "",
  brokerageExpiryDate: "",
  brokerageSalePriceClause: "",
  brokerageSalePrice: "",
  acceptanceClause: "",
  acceptanceTime: "",
  acceptanceDate: "",
  timePeriodClause: "",
  extendedDate: "",
  otherAmendments: "",
  otherConditionsConfirmed: false,
  buyerAgencyRole: "",
  buyerSignedCity1: "",
  buyerSignedDate1: "",
  buyerSignedTime1: "",
  buyerSignature1: "",
  buyerWitness1: "",
  buyerSignedCity2: "",
  buyerSignedDate2: "",
  buyerSignedTime2: "",
  buyerSignature2: "",
  buyerWitness2: "",
  sellerAgencyRole: "",
  sellerSignedCity1: "",
  sellerSignedDate1: "",
  sellerSignedTime1: "",
  sellerSignature1: "",
  sellerWitness1: "",
  sellerSignedCity2: "",
  sellerSignedDate2: "",
  sellerSignedTime2: "",
  sellerSignature2: "",
  sellerWitness2: "",
  spouseIntervention: "",
  spouseSignedCity: "",
  spouseSignedDate: "",
  spouseSignedTime: "",
  spouseSignature: "",
  spouseWitness: "",
});

/**
 * Map stored Amendments payload to PDF-ready output.
 * Use this when implementing actual PDF generation (e.g. pdf-lib, Puppeteer, or external service).
 */
export function mapAmendmentsPayloadToPdfOutput(payload: AmendmentsPayload): AmendmentsPdfOutput {
  const base = empty();
  if (!payload) return base;
  const keys = Object.keys(base) as (keyof AmendmentsPdfOutput)[];
  for (const key of keys) {
    const v = payload[key as keyof AmendmentsPayload];
    if (v !== undefined && v !== null) {
      (base as Record<string, unknown>)[key] = v;
    }
  }
  return base;
}

/**
 * Placeholder: generate Amendments PDF from structured payload.
 * Returns a blob URL or buffer when real PDF generation is added.
 */
export async function generateAmendmentsPdf(
  payload: AmendmentsPayload
): Promise<{ ok: boolean; blobUrl?: string; error?: string }> {
  const output = mapAmendmentsPayloadToPdfOutput(payload);
  // TODO: fill official OACIQ Amendments PDF template with output, then return blob/buffer
  // e.g. using pdf-lib: load template, get form, set fields from output, save.
  void output; // use when implementing
  return {
    ok: false,
    error: "PDF generation not yet implemented. Structured data is ready for export.",
  };
}
