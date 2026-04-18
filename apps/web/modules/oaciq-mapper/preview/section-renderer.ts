import type { SectionDefinition } from "../form-definition.types";

export function sectionHeading(section: SectionDefinition): string {
  return section.sectionLabel;
}
