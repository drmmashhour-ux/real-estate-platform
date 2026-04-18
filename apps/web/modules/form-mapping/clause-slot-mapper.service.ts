import type { ClauseSlot } from "./form-mapping.types";

export function defaultClauseSlotsForPackage(packageKey: string): ClauseSlot[] {
  void packageKey;
  return [
    {
      slotKey: "financing_condition",
      kind: "standard_condition",
      suggestedPlaceholder: "[Financing condition — broker to complete per official schedule]",
      brokerMustReview: true,
    },
    {
      slotKey: "inspection_condition",
      kind: "standard_condition",
      suggestedPlaceholder: "[Inspection — scope and deadlines per brokerage policy]",
      brokerMustReview: true,
    },
    {
      slotKey: "special_notes",
      kind: "special_note",
      suggestedPlaceholder: "[Special provisions — draft assistance only]",
      brokerMustReview: true,
    },
  ];
}
