import type { FormDefinition, SectionDef } from "./form-engine.types";

/** Derives navigable section list from registry (specimen structure — not PDF layout). */
export function parseSections(form: FormDefinition): SectionDef[] {
  return form.sectionDefinitions;
}
