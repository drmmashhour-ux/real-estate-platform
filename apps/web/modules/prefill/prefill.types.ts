import type { FieldMapResult } from "@/modules/form-mapping/form-mapping.types";

export type PrefillEngineResult = FieldMapResult & {
  formKey: string;
  confidence: number;
  draftNotice: "Draft assistance — broker review required.";
  explainability: string[];
};
