import { FORM_SCHEMAS } from "./formSchemaRegistry";
import { validateSections } from "./sectionValidator";
import { validateClauses } from "./clauseValidator";

export function alignDraftToFormSchema(formKey: string, sections: { title: string; content: string }[]) {
  const schema = FORM_SCHEMAS[formKey];
  if (!schema) return { sections, issues: ["SCHEMA_NOT_FOUND"] };

  // 1. Reorder sections based on schema
  const alignedSections = schema.requiredSections.map(requiredTitle => {
    const existing = sections.find(s => s.title.toUpperCase() === requiredTitle);
    if (existing) return existing;
    
    // 2. Insert missing section placeholders
    return {
      title: requiredTitle,
      content: `[MISSING CONTENT: ${requiredTitle}]`,
      isPlaceholder: true
    };
  });

  // Add any extra sections that were in the original draft but not in schema (at the end)
  const extraSections = sections.filter(s => !schema.requiredSections.includes(s.title.toUpperCase()));
  
  return {
    sections: [...alignedSections, ...extraSections],
    validation: {
      sections: validateSections(formKey, sections),
      clauses: validateClauses(formKey, sections)
    }
  };
}
