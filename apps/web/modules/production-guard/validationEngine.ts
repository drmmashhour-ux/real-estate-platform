import { validateFormSchema, PRODUCTION_FORM_SCHEMAS } from "./formSchema";
import { TurboDraftResult } from "@/modules/turbo-form-drafting/types";

export { validateFormSchema, PRODUCTION_FORM_SCHEMAS };

export interface SignatureGateResult {
  canSign: boolean;
  errors: string[];
}

export function validateBeforeSignature(
  draft: any, // TurboDraft model from DB
  result: TurboDraftResult, // Validation result from engine
  complianceScore: number,
  isPaid: boolean
): SignatureGateResult {
  const errors: string[] = [];

  // 1. Compliance Score Check (Threshold 90)
  if (complianceScore < 90) {
    errors.push(`Compliance score too low: ${complianceScore}/100. Minimum 90 required.`);
  }

  // 2. Critical Notices Acknowledgment
  const unacknowledgedCritical = result.notices.filter(n => n.severity === "CRITICAL" && !n.acknowledged);
  if (unacknowledgedCritical.length > 0) {
    errors.push(`Unacknowledged critical notices: ${unacknowledgedCritical.map(n => n.noticeKey).join(", ")}`);
  }

  // 3. Schema Validation
  const schemaValidation = validateFormSchema(draft.formKey, draft.contextJson);
  if (!schemaValidation.valid) {
    errors.push(...schemaValidation.errors);
  }

  // 4. Payment Gate
  if (!isPaid) {
    errors.push("Payment not completed.");
  }

  // 5. Blocking Risks from AI/Engine
  if (!result.canProceed) {
    errors.push(...result.blockingReasons);
  }

  return {
    canSign: errors.length === 0,
    errors
  };
}

export function validateAIOutput(
  aiOutput: any,
  formKey: string
): { valid: boolean; errors: string[] } {
  const schema = PRODUCTION_FORM_SCHEMAS[formKey];
  if (!schema) return { valid: false, errors: ["Invalid form key"] };

  const errors: string[] = [];

  // 1. Ensure all required sections exist and haven't been removed by AI
  const sectionIds = new Set(aiOutput.sections.map((s: any) => s.id));
  schema.requiredSections.forEach(rs => {
    if (!sectionIds.has(rs)) {
      errors.push(`AI attempted to remove mandatory section: ${rs}`);
    }
  });

  // 2. Prevent AI from inventing non-schema sections (if strict)
  if (schema.strictMode) {
    const allowedSections = new Set(schema.requiredSections);
    aiOutput.sections.forEach((s: any) => {
      if (!allowedSections.has(s.id)) {
        errors.push(`AI generated unallowed section: ${s.id}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
