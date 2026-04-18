export type IngestionSourceType = "oaciq_form" | "clause_book" | "playbook" | "precedent" | "other";

export type IngestionRegisterInput = {
  sourceType: IngestionSourceType;
  title: string;
  fileUrl?: string | null;
  brokerScope?: string | null;
  metadata?: Record<string, unknown>;
};
