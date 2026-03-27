import { getDraftTemplateById } from "@/src/modules/ai-drafting/templates/templateEngine";

export type ValidationIssue = {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
};

function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateDraft(templateId: string, values: Record<string, string>) {
  const template = getDraftTemplateById(templateId);
  if (!template) {
    return { valid: false, issues: [{ code: "template_not_found", message: "Template not found", severity: "error" as const }] };
  }

  const issues: ValidationIssue[] = [];
  for (const field of template.fields) {
    const value = String(values[field.key] ?? "").trim();
    if (field.required && !value) {
      issues.push({ code: "required_missing", field: field.key, message: `${field.label} is required`, severity: "error" });
    }
    if (field.key.includes("date") && value && !isDateLike(value)) {
      issues.push({ code: "invalid_date_format", field: field.key, message: `${field.label} must use YYYY-MM-DD`, severity: "error" });
    }
  }

  const startDate = values.start_date;
  const endDate = values.end_date;
  if (startDate && endDate && isDateLike(startDate) && isDateLike(endDate) && startDate > endDate) {
    issues.push({ code: "date_order_invalid", field: "end_date", message: "End date must be on or after start date", severity: "error" });
  }

  if (!String(values.clause_reference ?? "").trim() && template.id === "lease_notice_v1") {
    issues.push({ code: "clause_reference_missing", field: "clause_reference", message: "Lease notice should include a clause reference", severity: "warning" });
  }

  return { valid: issues.every((x) => x.severity !== "error"), issues };
}
