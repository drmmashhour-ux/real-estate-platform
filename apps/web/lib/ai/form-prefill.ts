export type PrefillInput = {
  formType:
    | "seller_declaration"
    | "brokerage_contract"
    | "promise_to_purchase"
    | "disclosure"
    | "identity_verification";
  listing?: Record<string, unknown>;
  seller?: Record<string, unknown>;
  buyer?: Record<string, unknown>;
  broker?: Record<string, unknown>;
  clauses?: Array<Record<string, unknown>>;
};

export function buildFormPrefillPrompt(input: PrefillInput): string {
  return `
You are assisting a licensed real estate broker with form prefilling.

Rules:
- Only prefill fields supported by provided data.
- Never invent facts.
- If data is missing, leave field blank and mark it as REQUIRED_REVIEW.
- Use neutral, legally cautious wording.
- Do not sign, approve, submit, or finalize.
- Do not convert uncertain information into factual statements.

Form type: ${input.formType}

Listing:
${JSON.stringify(input.listing ?? {}, null, 2)}

Seller:
${JSON.stringify(input.seller ?? {}, null, 2)}

Buyer:
${JSON.stringify(input.buyer ?? {}, null, 2)}

Broker:
${JSON.stringify(input.broker ?? {}, null, 2)}

Clauses:
${JSON.stringify(input.clauses ?? [], null, 2)}

Return JSON only:
{
  "prefilledFields": {},
  "requiredReviewFields": [],
  "missingFields": [],
  "warnings": []
}
`;
}
