import type {
  ContractTemplateDefinition,
  ContractTemplateField,
  TemplateSectionKey,
} from "@/modules/contracts/templates";
import { TEMPLATE_SECTION_KEYS, fieldsForSection, sortSections } from "@/modules/contracts/templates";

export type SectionHealth = "complete" | "warning" | "error" | "empty";

export type DraftAnalysis = {
  sectionStatus: Record<TemplateSectionKey, SectionHealth>;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  fieldHints: Record<string, string>;
  summary: string;
};

function valueFor(
  draftValues: Record<string, string>,
  key: string
): string {
  return (draftValues[key] ?? "").trim();
}

/**
 * Heuristic compliance + UX analysis for the admin drafting assistant (no external AI required).
 */
export function analyzeContractDraft(
  def: ContractTemplateDefinition,
  draftValues: Record<string, string>
): DraftAnalysis {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const fieldHints: Record<string, string> = {};

  const sectionStatus = {} as Record<TemplateSectionKey, SectionHealth>;
  for (const k of TEMPLATE_SECTION_KEYS) {
    sectionStatus[k] = "empty";
  }

  const sections = sortSections(def.sections);
  for (const sec of sections) {
    const fields = fieldsForSection(def, sec.key);
    if (fields.length === 0) {
      sectionStatus[sec.key] = "empty";
      continue;
    }

    let hasError = false;
    let hasWarning = false;

    for (const f of fields) {
      const v = valueFor(draftValues, f.key);
      if (f.required) {
        if (!v) {
          errors.push(`${f.label} (${sec.title}) is required.`);
          hasError = true;
          fieldHints[f.key] = "Required before you can save.";
        } else if (f.fieldType === "boolean") {
          const ok = v === "true" || v === "yes" || v === "1";
          if (!ok) {
            errors.push(`${f.label} must be confirmed for compliance.`);
            hasError = true;
            fieldHints[f.key] = "Check this to confirm.";
          }
        }
      }

      if (f.fieldType === "textarea" && v && v.length < 40) {
        warnings.push(`${f.label}: consider adding more detail for clarity.`);
        hasWarning = true;
        if (!fieldHints[f.key]) {
          fieldHints[f.key] = "Short answer — expand for a stronger clause.";
        }
      }

      if (f.fieldType === "text" && v && v.length < 3) {
        warnings.push(`${f.label}: value looks incomplete.`);
        hasWarning = true;
      }

      if (f.fieldType === "currency" && v && !/^\d/.test(v)) {
        warnings.push(`${f.label}: use digits for amounts (e.g. 450000).`);
        hasWarning = true;
      }
    }

    if (hasError) sectionStatus[sec.key] = "error";
    else if (hasWarning) sectionStatus[sec.key] = "warning";
    else {
      const anyFilled = fields.some((f) => valueFor(draftValues, f.key));
      sectionStatus[sec.key] = anyFilled ? "complete" : "empty";
    }
  }

  if (def.attachments.some((a) => a.required && a.type === "seller_declaration")) {
    suggestions.push("Ensure seller declaration is linked and completed for listings using this template.");
  }

  suggestions.push("Cross-check party names and property legal description with the deed or tax roll.");
  suggestions.push("Have counsel review jurisdiction-specific clauses before go-live.");

  const errCount = errors.length;
  const warnCount = warnings.length;
  let summary = "Draft looks consistent.";
  if (errCount > 0) summary = `${errCount} issue(s) must be fixed before save.`;
  else if (warnCount > 0) summary = `${warnCount} warning(s) — review before publishing.`;

  return {
    sectionStatus,
    errors,
    warnings,
    suggestions,
    fieldHints,
    summary,
  };
}

export function canSaveDraft(
  def: ContractTemplateDefinition,
  draftValues: Record<string, string>
): { ok: true } | { ok: false; message: string } {
  for (const f of def.fields) {
    if (!f.required) continue;
    const v = valueFor(draftValues, f.key);
    if (f.fieldType === "boolean") {
      const ok = v === "true" || v === "yes" || v === "1";
      if (!ok) return { ok: false, message: `Confirm required: ${f.label}` };
    } else if (!v) {
      return { ok: false, message: `Required field missing: ${f.label}` };
    }
  }
  return { ok: true };
}

/** Deterministic “auto fix”: trim strings, normalize booleans. */
export function autoFixDraftValues(
  def: ContractTemplateDefinition,
  draftValues: Record<string, string>
): Record<string, string> {
  const next = { ...draftValues };
  for (const f of def.fields) {
    const raw = next[f.key];
    if (typeof raw !== "string") continue;
    let v = raw.trim();
    if (f.fieldType === "boolean") {
      const low = v.toLowerCase();
      if (low === "y" || low === "yes") v = "true";
      if (low === "n" || low === "no") v = "false";
    }
    next[f.key] = v;
  }
  return next;
}

/** Improve text: append a neutral boilerplate line to the longest textarea (demo heuristic). */
export function improveTextDraft(
  def: ContractTemplateDefinition,
  draftValues: Record<string, string>
): Record<string, string> {
  const next = { ...draftValues };
  let longest: ContractTemplateField | null = null;
  let len = 0;
  for (const f of def.fields) {
    if (f.fieldType !== "textarea") continue;
    const v = (next[f.key] ?? "").length;
    if (v >= len) {
      len = v;
      longest = f;
    }
  }
  if (!longest) return next;
  const line =
    "\n\n[Addendum] The parties acknowledge they have reviewed this section and agree to act in good faith.";
  next[longest.key] = (next[longest.key] ?? "").trimEnd() + line;
  return next;
}
