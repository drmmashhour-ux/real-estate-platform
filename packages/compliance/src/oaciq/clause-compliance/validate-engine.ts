import { getClauseLibraryEntry } from "@/lib/compliance/oaciq/clause-compliance/library";
import { scanClauseTextForAmbiguity } from "@/lib/compliance/oaciq/clause-compliance/ambiguity";
import { enforcementDescriptorsForFlags } from "@/lib/compliance/oaciq/clause-compliance/enforcement";
import {
  deterministicClauseSuggestions,
  suggestClauseWordingWithAi,
} from "@/lib/compliance/oaciq/clause-compliance/ai-assist";
import type { ClauseInstance, ClauseValidationIssue, ClauseValidationResult } from "@/lib/compliance/oaciq/clause-compliance/types";

function nonEmpty(v: string | undefined): boolean {
  return Boolean(v && v.trim().length > 0);
}

function mergeText(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join("\n\n");
}

export function validateClauseInstance(instance: ClauseInstance): {
  issues: ClauseValidationIssue[];
  entry: ReturnType<typeof getClauseLibraryEntry>;
} {
  const issues: ClauseValidationIssue[] = [];
  const entry = getClauseLibraryEntry(instance.clauseId);

  if (!entry) {
    issues.push({
      code: "UNKNOWN_CLAUSE_ID",
      severity: "blocking",
      message: `Clause library id inconnu ou retiré : ${instance.clauseId}`,
      clauseId: instance.clauseId,
    });
    return { issues, entry: undefined };
  }

  if (!entry.active) {
    issues.push({
      code: "INACTIVE_CLAUSE",
      severity: "blocking",
      message: `Clause désactivée : ${entry.labelFr}`,
      clauseId: instance.clauseId,
    });
  }

  for (const key of entry.requiredParams) {
    if (!nonEmpty(instance.params[key])) {
      issues.push({
        code: "MISSING_PARAM",
        severity: "blocking",
        message: `Champ obligatoire manquant : ${key} (${entry.labelFr})`,
        clauseId: instance.clauseId,
      });
    }
  }

  const blob = mergeText(
    ...entry.requiredParams.map((k) => instance.params[k]),
    instance.narrativeFr,
    instance.narrativeEn,
  );

  for (const msg of scanClauseTextForAmbiguity(blob)) {
    issues.push({
      code: "AMBIGUOUS_LANGUAGE",
      severity: "blocking",
      message: msg,
      clauseId: instance.clauseId,
    });
  }

  if (entry.complianceFlags.includes("dual_representation_warning")) {
    issues.push({
      code: "DUAL_REPRESENTATION_FLAG",
      severity: "warning",
      message: "Double représentation — exiger divulgation et consentements avant signature.",
      clauseId: instance.clauseId,
    });
  }

  return { issues, entry };
}

export async function validateClauseBatch(params: {
  instances: ClauseInstance[];
  /** When true, may call OpenAI for wording hints (never for approval). */
  withAiSuggestions?: boolean;
}): Promise<ClauseValidationResult> {
  const allIssues: ClauseValidationIssue[] = [];
  const enforcement: ClauseValidationResult["enforcement"] = [];
  const seen = new Set<string>();

  for (const inst of params.instances) {
    const { issues, entry } = validateClauseInstance(inst);
    allIssues.push(...issues);
    if (entry?.active) {
      for (const d of enforcementDescriptorsForFlags(inst.clauseId, entry.complianceFlags)) {
        const k = `${d.kind}:${d.clauseId}`;
        if (seen.has(k)) continue;
        seen.add(k);
        enforcement.push(d);
      }
    }
  }

  const blocking = allIssues.filter((i) => i.severity === "blocking");
  const valid = blocking.length === 0;
  const blockSubmission = !valid;

  let suggestions = deterministicClauseSuggestions(allIssues);
  let aiAssisted = false;

  if (params.withAiSuggestions && blocking.length > 0) {
    const narrativeFr = params.instances.map((i) => i.narrativeFr ?? "").join("\n");
    const summary = blocking.map((b) => b.message).join("; ");
    const ai = await suggestClauseWordingWithAi({ narrativeFr, issuesSummary: summary });
    if (ai.suggestions.length > 0) {
      suggestions = [...suggestions, ...ai.suggestions];
      aiAssisted = ai.aiAssisted;
    }
  }

  return {
    valid,
    blockSubmission,
    issues: allIssues,
    enforcement,
    suggestions: [...new Set(suggestions)],
    aiAssistedSuggestions: aiAssisted,
  };
}

/** Synchronous batch validation (no AI). */
export function validateClauseBatchSync(instances: ClauseInstance[]): ClauseValidationResult {
  const allIssues: ClauseValidationIssue[] = [];
  const enforcement: ClauseValidationResult["enforcement"] = [];
  const seen = new Set<string>();

  for (const inst of instances) {
    const { issues, entry } = validateClauseInstance(inst);
    allIssues.push(...issues);
    if (entry?.active) {
      for (const d of enforcementDescriptorsForFlags(inst.clauseId, entry.complianceFlags)) {
        const k = `${d.kind}:${d.clauseId}`;
        if (seen.has(k)) continue;
        seen.add(k);
        enforcement.push(d);
      }
    }
  }

  const blocking = allIssues.filter((i) => i.severity === "blocking");
  const valid = blocking.length === 0;

  return {
    valid,
    blockSubmission: !valid,
    issues: allIssues,
    enforcement,
    suggestions: deterministicClauseSuggestions(allIssues),
    aiAssistedSuggestions: false,
  };
}

/** Legacy free-text clauses — weaker heuristics until migrated to structured instances. */
export function validateLegacyClauseStrings(clauses: string[]): ClauseValidationResult {
  const issues: ClauseValidationIssue[] = [];
  clauses.forEach((text, i) => {
    const clauseId = `legacy_${i + 1}`;
    if (typeof text !== "string" || !text.trim()) {
      issues.push({
        code: "EMPTY_CLAUSE",
        severity: "blocking",
        message: `Clause ${i + 1} est vide.`,
        clauseId,
      });
      return;
    }
    const t = text.trim();
    if (!/\b(doit|s'engage|s’engage|obligé|responsable|interdit|sans)\b/i.test(t)) {
      issues.push({
        code: "WEAK_OBLIGATION",
        severity: "warning",
        message: `Clause ${i + 1} : formulation d'obligation peu explicite — préciser l'acteur et l'action.`,
        clauseId,
      });
    }
    for (const msg of scanClauseTextForAmbiguity(t)) {
      issues.push({
        code: "AMBIGUOUS_LANGUAGE",
        severity: "blocking",
        message: `Clause ${i + 1}: ${msg}`,
        clauseId,
      });
    }
  });

  const blocking = issues.filter((x) => x.severity === "blocking");
  return {
    valid: blocking.length === 0,
    blockSubmission: blocking.length > 0,
    issues,
    enforcement: [],
    suggestions: deterministicClauseSuggestions(issues),
    aiAssistedSuggestions: false,
  };
}
