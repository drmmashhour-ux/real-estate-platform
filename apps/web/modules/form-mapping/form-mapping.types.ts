export type FieldMapResult = {
  templateKey: string;
  mappedFields: Record<string, unknown>;
  missingRequiredFields: string[];
  warnings: string[];
};

export type ClauseSlotKind =
  | "standard_condition"
  | "additional_condition"
  | "annex_required"
  | "special_note"
  | "modification_note";

export type ClauseSlot = {
  slotKey: string;
  kind: ClauseSlotKind;
  suggestedPlaceholder: string;
  brokerMustReview: true;
};
