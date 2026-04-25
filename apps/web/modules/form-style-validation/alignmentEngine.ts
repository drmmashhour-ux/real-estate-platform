import { FORM_SCHEMAS } from "./formSchemaRegistry";
import { validateSections, SectionValidationResult } from "./sectionValidator";
import { validateClauses, ClauseIssue } from "./clauseValidator";
import { DRAFTING_RULES } from "./draftingRules";

export interface AlignmentResult {
  sections: any[];
  validation: {
    sections: SectionValidationResult;
    clauses: ClauseIssue[];
  };
}

export function alignDraftToFormSchema(formKey: string, sections: any[]): AlignmentResult {
  const schema = FORM_SCHEMAS[formKey];
  const sectionIds = sections.map(s => s.id);
  
  // 1. Run Validators
  const sectionValidation = validateSections(formKey, sectionIds);
  const clauseValidation = validateClauses(formKey, sections);

  // 2. Alignment Logic: Reorder and Add Placeholders
  let alignedSections = [...sections];

  if (schema) {
    // Reorder based on schema
    alignedSections = schema.requiredSections
      .map(id => {
        const existing = sections.find(s => s.id === id);
        if (existing) return existing;
        
        // Return placeholder for missing mandatory section
        return {
          id,
          title: id.replace(/_/g, " "),
          content: `[SECTION MANQUANTE: ${id}]`,
          isPlaceholder: true,
          isMandatory: true
        };
      });
    
    // Add any sections that were in original draft but not in schema (at the end)
    const extraSections = sections.filter(s => !schema.requiredSections.includes(s.id));
    alignedSections = [...alignedSections, ...extraSections];
  }

  return {
    sections: alignedSections,
    validation: {
      sections: sectionValidation,
      clauses: clauseValidation
    }
  };
}
