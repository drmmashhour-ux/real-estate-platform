import { validateFormSchema, FORM_SCHEMAS } from "./formSchema";
import { TurboDraftSection } from "../turbo-form-drafting/types";

export function validateBeforeSignature(
  draft: any,
  resultJson: any,
  complianceScore: number,
  isPaid: boolean
): { canSign: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Compliance Score threshold
  const minScore = 80; 
  if (complianceScore < minScore) {
    errors.push(`Compliance score too low: ${complianceScore} (min ${minScore})`);
  }

  // 2. Critical notices
  const notices = resultJson?.notices || [];
  const criticalUnaccepted = notices.filter((n: any) => n.severity === "CRITICAL" && !n.acknowledged);
  if (criticalUnaccepted.length > 0) {
    errors.push(`${criticalUnaccepted.length} critical notices remain unacknowledged`);
  }

  // 3. Mandatory sections/schema
  const schemaValidation = validateFormSchema(draft.formKey, resultJson?.sections || []);
  if (!schemaValidation.valid) {
    errors.push(...schemaValidation.errors);
  }

  // 4. Payment
  if (!isPaid) {
    errors.push("Payment required for signature");
  }

  // 5. Required fields check
  const context = draft.contextJson as any;
  const schema = FORM_SCHEMAS[draft.formKey];
  if (schema) {
    // Basic field presence check can be added here if needed
  }

  return {
    canSign: errors.length === 0,
    errors
  };
}

export function validateAIOutput(
  result: any,
  formKey: string
): { valid: boolean; errors: string[] } {
  const schema = FORM_SCHEMAS[formKey];
  if (!schema) return { valid: false, errors: [`Schema not found for ${formKey}`] };

  const sectionIds = (result.sections || []).map((s: any) => s.id);
  const errors: string[] = [];

  // AI must not remove required sections
  for (const req of schema.requiredSections) {
    if (!sectionIds.includes(req)) {
      errors.push(`AI removed mandatory section: ${req}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
