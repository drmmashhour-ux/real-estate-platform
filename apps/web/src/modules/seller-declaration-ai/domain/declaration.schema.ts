import type { DeclarationSection } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

export const sellerDeclarationSections: DeclarationSection[] = [
  {
    key: "property_identity",
    label: "Property identity",
    description: "Core identifiers and location details.",
    fields: [
      { key: "property_address", label: "Property address", inputType: "text", required: true, helpText: "Full civic address.", aiAssistAllowed: false },
      { key: "property_type", label: "Property type", inputType: "select", required: true, options: ["single_family", "condo", "townhouse", "plex", "other"], helpText: "Select the best fit.", aiAssistAllowed: false },
      { key: "year_built", label: "Year built", inputType: "text", required: false, helpText: "Approximate if exact year unknown.", aiAssistAllowed: false },
    ],
  },
  {
    key: "ownership_occupancy",
    label: "Ownership / occupancy",
    description: "Ownership and occupancy disclosures.",
    fields: [
      { key: "owner_occupied", label: "Owner occupied", inputType: "boolean", required: true, helpText: "Is the property owner-occupied?", aiAssistAllowed: false },
      { key: "occupancy_notes", label: "Occupancy notes", inputType: "textarea", required: false, helpText: "Provide occupancy history if relevant.", aiAssistAllowed: true },
    ],
  },
  {
    key: "known_defects",
    label: "Known defects",
    description: "Known defects and material conditions.",
    fields: [
      { key: "known_defects_flag", label: "Any known defects", inputType: "boolean", required: true, helpText: "Disclose known defects.", aiAssistAllowed: false },
      { key: "known_defects_details", label: "Defect details", inputType: "textarea", required: true, conditional: { fieldKey: "known_defects_flag", equals: true }, helpText: "Describe each known defect factually.", aiAssistAllowed: true },
    ],
  },
  {
    key: "water_damage",
    label: "Water damage / infiltration",
    description: "Water events and remediation details.",
    fields: [
      { key: "water_damage_flag", label: "Any water damage/infiltration", inputType: "boolean", required: true, helpText: "Include leaks, floods, seepage.", aiAssistAllowed: false },
      { key: "water_damage_details", label: "Water damage details", inputType: "textarea", required: true, conditional: { fieldKey: "water_damage_flag", equals: true }, helpText: "When, where, and what was done.", aiAssistAllowed: true },
    ],
  },
  {
    key: "structural_issues",
    label: "Structural issues",
    description: "Foundation, framing, and structural concerns.",
    fields: [
      { key: "structural_issues_flag", label: "Any structural issues", inputType: "boolean", required: true, helpText: "Disclose known structural concerns.", aiAssistAllowed: false },
      { key: "structural_issues_details", label: "Structural issue details", inputType: "textarea", required: true, conditional: { fieldKey: "structural_issues_flag", equals: true }, helpText: "State affected area and current status.", aiAssistAllowed: true },
    ],
  },
  {
    key: "renovations_repairs",
    label: "Renovations / repairs",
    description: "Material renovations and repairs history.",
    fields: [
      { key: "renovations_flag", label: "Any major renovations/repairs", inputType: "boolean", required: true, helpText: "Include major work only.", aiAssistAllowed: false },
      { key: "renovations_details", label: "Renovation/repair details", inputType: "textarea", required: true, conditional: { fieldKey: "renovations_flag", equals: true }, helpText: "Include dates, contractor, permits if known.", aiAssistAllowed: true },
    ],
  },
  {
    key: "legal_disputes",
    label: "Legal disputes / claims",
    description: "Past or ongoing legal disputes and claims.",
    fields: [
      { key: "legal_dispute_flag", label: "Any legal disputes/claims", inputType: "boolean", required: true, helpText: "Disclose disputes or claims affecting property.", aiAssistAllowed: false },
      { key: "legal_dispute_details", label: "Dispute/claim details", inputType: "textarea", required: true, conditional: { fieldKey: "legal_dispute_flag", equals: true }, helpText: "Include status and impact.", aiAssistAllowed: true },
    ],
  },
  {
    key: "environmental_concerns",
    label: "Environmental concerns",
    description: "Environmental risks or contamination.",
    fields: [
      { key: "environmental_flag", label: "Any environmental concerns", inputType: "boolean", required: true, helpText: "E.g. contamination, mold concerns.", aiAssistAllowed: false },
      { key: "environmental_details", label: "Environmental concern details", inputType: "textarea", required: true, conditional: { fieldKey: "environmental_flag", equals: true }, helpText: "Describe facts and known remediation.", aiAssistAllowed: true },
    ],
  },
  {
    key: "inclusions_exclusions",
    label: "Appliances / inclusions / exclusions",
    description: "What is included and excluded from sale.",
    fields: [
      { key: "inclusions", label: "Inclusions", inputType: "textarea", required: true, helpText: "List included items.", aiAssistAllowed: true },
      { key: "exclusions", label: "Exclusions", inputType: "textarea", required: false, helpText: "List excluded items.", aiAssistAllowed: true },
    ],
  },
  {
    key: "tenant_lease_status",
    label: "Tenant / lease status",
    description: "Lease and tenant disclosures if applicable.",
    fields: [
      { key: "tenant_present", label: "Tenant currently in place", inputType: "boolean", required: true, helpText: "Is there an active tenant?", aiAssistAllowed: false },
      { key: "lease_details", label: "Lease details", inputType: "textarea", required: true, conditional: { fieldKey: "tenant_present", equals: true }, helpText: "Lease end date, rent, terms.", aiAssistAllowed: true },
    ],
  },
  {
    key: "additional_notes",
    label: "Additional notes",
    description: "Additional material facts not covered above.",
    fields: [
      { key: "additional_notes", label: "Additional notes", inputType: "textarea", required: false, helpText: "Neutral factual notes only.", aiAssistAllowed: true },
    ],
  },
];
