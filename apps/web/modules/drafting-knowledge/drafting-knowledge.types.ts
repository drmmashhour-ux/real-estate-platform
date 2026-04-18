/**
 * Facade types — drafting knowledge is stored in `DraftingSource`, `ClauseTemplate`, and `KnowledgeDocument` rows.
 */
export type DraftingSourceKind =
  | "training_book"
  | "operations_guide"
  | "law_reference"
  | "clause_library"
  | "internal_playbook"
  | "precedent_note"
  | "official_form_reference";
