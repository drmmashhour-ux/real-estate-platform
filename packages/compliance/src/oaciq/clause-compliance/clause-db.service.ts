import type { ClausesLibrary, ContractClause, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { scanClauseTextForAmbiguity } from "@/lib/compliance/oaciq/clause-compliance/ambiguity";
import { enforcementDescriptorsForFlags } from "@/lib/compliance/oaciq/clause-compliance/enforcement";
import type { ClauseComplianceFlag, ClauseEnforcementDescriptor } from "@/lib/compliance/oaciq/clause-compliance/types";

export type ClauseDbValidation = {
  valid: boolean;
  errors: string[];
  errorCodes: string[];
  ai_flags: string[];
  missingActor: boolean;
  missingDeadline: boolean;
  missingNotice: boolean;
  missingConsequence: boolean;
  ambiguousLanguage: boolean;
};

function enforcementKeyToFlags(key: string | null): ClauseComplianceFlag[] {
  if (!key) return [];
  switch (key) {
    case "off_market":
      return ["off_market"];
    case "security_deposit_trust":
      return ["security_deposit_trust"];
    case "dual_representation":
      return ["dual_representation_warning"];
    case "enterprise_sale":
      return ["enterprise_combined_transaction"];
    default:
      return [];
  }
}

export function validateClauseAgainstLibrary(
  row: Pick<ContractClause, "customText" | "actorDefined" | "deadlineDefined" | "noticeDefined" | "consequenceDefined">,
  lib: Pick<
    ClausesLibrary,
    "requiresActor" | "requiresDeadline" | "requiresNotice" | "requiresConsequence" | "templateText"
  >,
): ClauseDbValidation {
  const errorCodes: string[] = [];
  const errors: string[] = [];

  const missingActor = lib.requiresActor && !row.actorDefined;
  const missingDeadline = lib.requiresDeadline && !row.deadlineDefined;
  const missingNotice = lib.requiresNotice && !row.noticeDefined;
  const missingConsequence = lib.requiresConsequence && !row.consequenceDefined;

  if (missingActor) {
    errorCodes.push("MISSING_ACTOR");
    errors.push("Responsible party (actor) must be explicitly defined.");
  }
  if (missingDeadline) {
    errorCodes.push("MISSING_DEADLINE");
    errors.push("Deadline must be explicit (date, fixed days, or clear triggering event).");
  }
  if (missingNotice) {
    errorCodes.push("MISSING_NOTICE");
    errors.push("Notification requirement must be specified.");
  }
  if (missingConsequence) {
    errorCodes.push("MISSING_CONSEQUENCE");
    errors.push("Consequence if not respected must be defined.");
  }

  const textBlob = [row.customText?.trim(), lib.templateText].filter(Boolean).join("\n\n");
  const amb = scanClauseTextForAmbiguity(textBlob);
  const ambiguousLanguage = amb.length > 0;
  if (ambiguousLanguage) {
    errorCodes.push("AMBIGUOUS_LANGUAGE");
    for (const m of amb) errors.push(m);
  }

  const valid = errorCodes.length === 0;
  return {
    valid,
    errors,
    errorCodes,
    ai_flags: ambiguousLanguage ? ["ambiguous_wording_review_recommended"] : [],
    missingActor,
    missingDeadline,
    missingNotice,
    missingConsequence,
    ambiguousLanguage,
  };
}

export async function persistClauseValidationRun(params: {
  contractClauseId: string;
  result: ClauseDbValidation;
  validatedByUserId: string | null;
  aiFlag: boolean;
}) {
  return prisma.clauseValidation.create({
    data: {
      contractClauseId: params.contractClauseId,
      missingActor: params.result.missingActor,
      missingDeadline: params.result.missingDeadline,
      missingNotice: params.result.missingNotice,
      missingConsequence: params.result.missingConsequence,
      ambiguousLanguage: params.result.ambiguousLanguage,
      aiFlag: params.aiFlag,
      errorCodes: params.result.errorCodes,
      validatedByUserId: params.validatedByUserId,
    },
  });
}

export async function updateContractClauseValidationState(
  contractClauseId: string,
  result: ClauseDbValidation,
) {
  return prisma.contractClause.update({
    where: { id: contractClauseId },
    data: {
      validated: result.valid,
      validationErrors: result.errors as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function validateAllContractClauses(params: {
  contractId: string;
  validatedByUserId: string | null;
  persistRuns: boolean;
  aiFlag?: boolean;
}) {
  const rows = await prisma.contractClause.findMany({
    where: { contractId: params.contractId },
    include: { libraryClause: true },
  });

  const results: Array<{ contractClauseId: string; validation: ClauseDbValidation }> = [];
  const enforcement: ClauseEnforcementDescriptor[] = [];
  const seenEnforcement = new Set<string>();

  for (const row of rows) {
    const validation = validateClauseAgainstLibrary(row, row.libraryClause);
    results.push({ contractClauseId: row.id, validation });
    await updateContractClauseValidationState(row.id, validation);
    if (params.persistRuns) {
      await persistClauseValidationRun({
        contractClauseId: row.id,
        result: validation,
        validatedByUserId: params.validatedByUserId,
        aiFlag: params.aiFlag ?? false,
      });
    }
    if (validation.valid) {
      const flags = enforcementKeyToFlags(row.libraryClause.enforcementKey);
      for (const d of enforcementDescriptorsForFlags(row.libraryClause.code, flags)) {
        const k = `${d.kind}:${d.clauseId}`;
        if (seenEnforcement.has(k)) continue;
        seenEnforcement.add(k);
        enforcement.push(d);
      }
    }
  }

  const allValid = results.every((r) => r.validation.valid);

  return {
    contractId: params.contractId,
    allValid,
    clauseResults: results,
    enforcement,
  };
}

export async function addClauseToContract(params: {
  contractId: string;
  libraryClauseId?: string;
  code?: string;
  customText?: string | null;
  actorDefined?: boolean;
  deadlineDefined?: boolean;
  noticeDefined?: boolean;
  consequenceDefined?: boolean;
}) {
  let lib: ClausesLibrary | null = null;
  if (params.libraryClauseId) {
    lib = await prisma.clausesLibrary.findFirst({
      where: { id: params.libraryClauseId, active: true },
    });
  } else if (params.code) {
    lib = await prisma.clausesLibrary.findFirst({
      where: { code: params.code.trim(), active: true },
    });
  }
  if (!lib) {
    throw new Error("CLAUSE_LIBRARY_NOT_FOUND");
  }

  return prisma.contractClause.create({
    data: {
      contractId: params.contractId,
      libraryClauseId: lib.id,
      customText: params.customText ?? null,
      actorDefined: params.actorDefined ?? false,
      deadlineDefined: params.deadlineDefined ?? false,
      noticeDefined: params.noticeDefined ?? false,
      consequenceDefined: params.consequenceDefined ?? false,
      validated: false,
    },
    include: { libraryClause: true },
  });
}

export async function getClausesLibraryGrouped() {
  const rows = await prisma.clausesLibrary.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
  const byCategory = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.category;
    const arr = byCategory.get(k) ?? [];
    arr.push(r);
    byCategory.set(k, arr);
  }
  return Object.fromEntries(byCategory.entries());
}
