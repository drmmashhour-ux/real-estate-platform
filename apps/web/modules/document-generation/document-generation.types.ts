export type DraftBundleKind = "structured_json" | "human_readable" | "checklist";

export type DraftGenerationResult = {
  kind: DraftBundleKind;
  label: string;
  payload: Record<string, unknown>;
  draftNotice: "Draft assistance — broker review required.";
};
