/**
 * Structured fields for the Seller Declaration Form (property) — stored in `SellerDisclosure.formData`.
 */
export type TriState = "yes" | "no" | "";

export type SellerDeclarationFormData = {
  propertyIdentification?: {
    address?: string;
    cadastreNumber?: string;
    propertyType?: string;
    yearBuilt?: string;
  };
  ownership?: {
    isLegalOwnerOrAuthorized?: boolean;
    noHiddenOwnership?: boolean;
    notUnderDispute?: boolean;
  };
  condition?: {
    noHiddenDefects?: boolean;
    noWaterDamage?: boolean;
    noStructuralIssues?: boolean;
    noPestInfestation?: boolean;
    issuesDetail?: string;
  };
  workRenovations?: {
    renovationsList?: string;
    permitsObtained?: TriState;
  };
  legalFinancial?: {
    mortgageOnProperty?: TriState;
    legalIssueOrLien?: TriState;
    explain?: string;
  };
  inclusionsExclusions?: {
    included?: string;
    excluded?: string;
  };
  services?: {
    utilities?: string;
    condoFees?: string;
    taxes?: string;
  };
  declaration?: {
    informationTrue?: boolean;
    nothingHidden?: boolean;
    understandsLiability?: boolean;
  };
  signature?: {
    agreed?: boolean;
    signedAt?: string;
    typedName?: string;
  };
};

export function emptySellerDeclarationFormData(): SellerDeclarationFormData {
  return {
    propertyIdentification: {},
    ownership: {},
    condition: {},
    workRenovations: { permitsObtained: "" },
    legalFinancial: { mortgageOnProperty: "", legalIssueOrLien: "" },
    inclusionsExclusions: {},
    services: {},
    declaration: {},
    signature: {},
  };
}

/** Map structured form to legacy text columns for search / admin / backwards compatibility. */
export function deriveLegacyTextFields(fd: SellerDeclarationFormData): {
  structuralIssues: string | null;
  waterDamage: string | null;
  renovations: string | null;
  defects: string | null;
} {
  const lines: string[] = [];
  if (fd.ownership) {
    const o = fd.ownership;
    if (o.isLegalOwnerOrAuthorized) lines.push("Confirms: legal owner or authorized representative.");
    if (o.noHiddenOwnership) lines.push("Confirms: no hidden ownership.");
    if (o.notUnderDispute) lines.push("Confirms: property not under dispute.");
  }
  const c = fd.condition;
  if (
    c &&
    (c.issuesDetail?.trim() ||
      [c.noHiddenDefects, c.noWaterDamage, c.noStructuralIssues, c.noPestInfestation].some((x) => typeof x === "boolean"))
  ) {
    lines.push(
      `Affirms no hidden defects: ${c.noHiddenDefects ? "yes" : "no"}; no water damage/infiltration: ${c.noWaterDamage ? "yes" : "no"}; no structural issues: ${c.noStructuralIssues ? "yes" : "no"}; no pest infestation: ${c.noPestInfestation ? "yes" : "no"}.`
    );
  }
  if (fd.workRenovations?.permitsObtained) {
    lines.push(`Renovation permits obtained: ${fd.workRenovations.permitsObtained}`);
  }
  if (fd.legalFinancial?.mortgageOnProperty) {
    lines.push(`Mortgage on property: ${fd.legalFinancial.mortgageOnProperty}`);
  }
  if (fd.legalFinancial?.legalIssueOrLien) {
    lines.push(`Legal issue or lien: ${fd.legalFinancial.legalIssueOrLien}`);
  }

  const structuralIssues = lines.length ? lines.join("\n") : null;

  const cond = fd.condition;
  const waterDamage =
    cond?.noWaterDamage === false
      ? (cond.issuesDetail?.trim() || "Seller reported water damage or infiltration (see declaration).")
      : cond?.noWaterDamage === true
        ? "None reported (affirmed)."
        : null;

  const ren = fd.workRenovations;
  const renovations = ren?.renovationsList?.trim()
    ? [ren.renovationsList.trim(), ren.permitsObtained ? `Permits: ${ren.permitsObtained}` : ""]
        .filter(Boolean)
        .join("\n")
    : ren?.permitsObtained
      ? `Permits: ${ren.permitsObtained}`
      : null;

  const defects =
    [
      cond?.issuesDetail?.trim(),
      fd.legalFinancial?.explain?.trim(),
      fd.inclusionsExclusions?.included?.trim(),
      fd.inclusionsExclusions?.excluded?.trim(),
      fd.services?.utilities?.trim(),
      fd.services?.condoFees?.trim(),
      fd.services?.taxes?.trim(),
    ]
      .filter(Boolean)
      .join("\n\n") || null;

  return { structuralIssues, waterDamage, renovations, defects };
}

export function parseFormDataJson(value: unknown): SellerDeclarationFormData {
  if (!value || typeof value !== "object") return emptySellerDeclarationFormData();
  return { ...emptySellerDeclarationFormData(), ...(value as SellerDeclarationFormData) };
}

export function mergeFormDataFromRecord(existing: unknown): SellerDeclarationFormData {
  return parseFormDataJson(existing);
}

/** Server/client: return error message if incomplete, or null if OK. */
export function validateSellerDeclarationForSubmission(fd: SellerDeclarationFormData): string | null {
  if (!fd.declaration?.informationTrue || !fd.declaration?.nothingHidden || !fd.declaration?.understandsLiability) {
    return "Declaration section (8) must be fully confirmed.";
  }
  if (!fd.signature?.agreed) return "You must agree and sign the declaration (section 9).";
  if (!fd.signature?.typedName?.trim()) return "Please type your full name as signature (section 9).";
  if (
    !fd.ownership?.isLegalOwnerOrAuthorized ||
    !fd.ownership?.noHiddenOwnership ||
    !fd.ownership?.notUnderDispute
  ) {
    return "Ownership section (2) must be fully confirmed.";
  }
  const c = fd.condition;
  if (
    !c ||
    typeof c.noHiddenDefects !== "boolean" ||
    typeof c.noWaterDamage !== "boolean" ||
    typeof c.noStructuralIssues !== "boolean" ||
    typeof c.noPestInfestation !== "boolean"
  ) {
    return "Property condition (section 3) requires all yes/no answers.";
  }
  if (!fd.workRenovations?.permitsObtained) {
    return "Please indicate whether permits were obtained (section 4).";
  }
  if (!fd.legalFinancial?.mortgageOnProperty || !fd.legalFinancial?.legalIssueOrLien) {
    return "Legal & financial (section 5) requires mortgage and lien answers.";
  }
  return null;
}
