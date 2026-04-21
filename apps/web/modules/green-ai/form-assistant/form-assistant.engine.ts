import type { GreenEngineInput } from "@/modules/green/green.types";
import type { GreenImprovement } from "@/modules/green/green.types";
import {
  RENOCLIMAT_FORM_ASSISTANT_DISCLAIMER,
  type FieldGuidance,
  type FieldValidationIssue,
  type FormAssistantInput,
  type FormAssistantOutput,
  type FormFieldId,
  type RenoclimatFormDraft,
} from "./form.types";
import { mapIntakeToRenoclimatForm } from "./form-field.mapper";

const FIELD_GUIDANCE: Record<string, FieldGuidance> = {
  propertyType: {
    fieldId: "propertyType",
    label: "Property type",
    explanation: "Detached, townhouse, condo, duplex — wording should mirror permit descriptions.",
    example: "Detached single-family",
  },
  ownerName: {
    fieldId: "ownerName",
    label: "Owner name",
    explanation: "Legal name(s) that match tax roll or municipal records for the dwelling.",
    example: "Jean Tremblay & Marie Dupont",
  },
  address: {
    fieldId: "address",
    label: "Civic address",
    explanation: "Street number and name exactly as used for utilities and official correspondence.",
    example: "842 Rue Saint-Joseph Est",
  },
  municipality: {
    fieldId: "municipality",
    label: "Municipality",
    explanation: "City or borough administering building permits — often required on government forms.",
    example: "Québec (La Cité–Limoilou)",
  },
  postalCode: {
    fieldId: "postalCode",
    label: "Postal code",
    explanation: "Canadian postal code HxY ZxZ format where requested.",
    example: "G1K 3B8",
  },
  propertyType: {
    fieldId: "propertyType",
    label: "Building type",
    explanation: "Detached, semi-detached, row/townhouse, condo unit, plex — programs treat eligibility differently.",
    example: "Single-family detached house",
  },
  yearBuilt: {
    fieldId: "yearBuilt",
    label: "Year built",
    explanation: "Approximate construction year influences baseline efficiency assumptions.",
    example: "1987",
  },
  heatingSystem: {
    fieldId: "heatingSystem",
    label: "Primary heating",
    explanation: "Main space-heating equipment (fuel + distribution). Cold-climate heat pumps are often central to retrofit plans.",
    example: "Oil furnace with forced air — considering cold-climate heat pump",
  },
  insulation: {
    fieldId: "insulation",
    label: "Envelope / insulation (self-reported)",
    explanation: "High-level attic/wall performance as you understand it today — evaluator will verify.",
    example: "Attic R-40 added 2018; walls unknown",
  },
  windows: {
    fieldId: "windows",
    label: "Windows",
    explanation: "Glazing generation impacts loads and incentive categories.",
    example: "Mixed double-glazed (1995) + some originals single-glazed",
  },
  plannedUpgrades: {
    fieldId: "plannedUpgrades",
    label: "Planned measures",
    explanation: "Bullet list aligned with evaluator recommendations — do not start major work before pre-retrofit evaluation unless officially cleared.",
    example: "Attic insulation to code; air sealing; cold-climate heat pump; basement rim joist insulation",
  },
  additionalNotes: {
    fieldId: "additionalNotes",
    label: "Notes for your file",
    explanation: "Parking, access constraints, tenants, heritage overlays — anything crews or evaluators should know.",
    example: "Detached garage — electrical panel upgrade likely before heat pump.",
  },
};

function validateDraft(data: RenoclimatFormDraft): {
  missingFields: FormFieldId[];
  issues: FieldValidationIssue[];
  isReady: boolean;
} {
  const missingFields: FormFieldId[] = [];
  const issues: FieldValidationIssue[] = [];

  if (!data.ownerName.trim()) missingFields.push("ownerName");
  if (!data.address.trim()) missingFields.push("address");
  if (!data.propertyType.trim()) missingFields.push("propertyType");
  if (!data.heatingSystem.trim()) missingFields.push("heatingSystem");
  if (!data.insulation.trim()) missingFields.push("insulation");
  if (!data.plannedUpgrades.length) missingFields.push("plannedUpgrades");

  if (!data.municipality?.trim()) {
    issues.push({
      fieldId: "municipality",
      severity: "warning",
      message: "Many intake forms ask for municipality explicitly — add it when you have it.",
    });
  }

  return {
    missingFields,
    issues,
    isReady: missingFields.length === 0,
  };
}

function toPlainText(data: RenoclimatFormDraft): string {
  const lines = [
    "RÉNOCLIMAT / RETROFIT INTAKE DRAFT — NOT SUBMITTED BY LECIPM",
    "",
    `Owner: ${data.ownerName || "—"}`,
    `Address: ${data.address || "—"}`,
    data.municipality ? `Municipality: ${data.municipality}` : null,
    data.postalCode ? `Postal code: ${data.postalCode}` : null,
    `Property type: ${data.propertyType || "—"}`,
    data.yearBuilt != null ? `Year built: ${data.yearBuilt}` : null,
    `Heating: ${data.heatingSystem || "—"}`,
    `Insulation (self-reported): ${data.insulation || "—"}`,
    data.windows ? `Windows: ${data.windows}` : null,
    "",
    "Planned upgrades:",
    ...data.plannedUpgrades.map((u, i) => `${i + 1}. ${u}`),
    "",
    data.additionalNotes ? `Notes:\n${data.additionalNotes}` : null,
    "",
    RENOCLIMAT_FORM_ASSISTANT_DISCLAIMER,
  ].filter((x): x is string => Boolean(x));

  return lines.join("\n");
}

function toPdfSections(data: RenoclimatFormDraft): FormAssistantOutput["pdfReady"] {
  return [
    {
      title: "Owner & property",
      lines: [
        `Owner: ${data.ownerName}`,
        `Address: ${data.address}`,
        ...(data.municipality ? [`Municipality: ${data.municipality}`] : []),
        ...(data.postalCode ? [`Postal code: ${data.postalCode}`] : []),
      ],
    },
    {
      title: "Building profile",
      lines: [
        `Type: ${data.propertyType}`,
        ...(data.yearBuilt != null ? [`Year built: ${data.yearBuilt}`] : []),
        `Heating: ${data.heatingSystem}`,
        `Insulation: ${data.insulation}`,
        ...(data.windows ? [`Windows: ${data.windows}`] : []),
      ],
    },
    {
      title: "Planned measures (draft)",
      lines: data.plannedUpgrades.length > 0 ? data.plannedUpgrades.map((u, i) => `${i + 1}. ${u}`) : ["—"],
    },
    ...(data.additionalNotes
      ? [{ title: "Notes", lines: [data.additionalNotes] }]
      : []),
  ];
}

/**
 * Produces structured draft data, validation, copy export, and PDF-ready sections.
 * Does not persist or transmit to government systems.
 */
export function runFormAssistant(args: {
  intake: GreenEngineInput;
  improvements?: GreenImprovement[];
  overrides?: Partial<RenoclimatFormDraft>;
  meta?: FormAssistantInput;
}): FormAssistantOutput {
  const mergedMeta: FormAssistantInput = {
    ownerName: args.meta?.ownerName,
    address: args.meta?.address,
    municipality: args.meta?.municipality,
    postalCode: args.meta?.postalCode,
    additionalNotes: args.meta?.additionalNotes,
    ...args.meta,
  };

  let data = mapIntakeToRenoclimatForm({
    intake: args.intake,
    improvements: args.improvements,
    ownerName: mergedMeta.ownerName,
    address: mergedMeta.address,
    municipality: mergedMeta.municipality,
    postalCode: mergedMeta.postalCode,
    additionalNotes: mergedMeta.additionalNotes,
  });

  if (mergedMeta.propertyType) data = { ...data, propertyType: mergedMeta.propertyType };
  if (mergedMeta.yearBuilt != null) data = { ...data, yearBuilt: mergedMeta.yearBuilt };
  if (mergedMeta.plannedUpgrades?.length) {
    data = { ...data, plannedUpgrades: [...new Set([...data.plannedUpgrades, ...mergedMeta.plannedUpgrades])] };
  }

  if (args.overrides) {
    const { plannedUpgrades: puOverride, ...rest } = args.overrides;
    data = { ...data, ...rest };
    if (puOverride !== undefined && puOverride.length > 0) {
      data.plannedUpgrades = puOverride;
    }
  }

  const validation = validateDraft(data);
  const guidanceByField = FIELD_GUIDANCE as Partial<Record<FormFieldId, FieldGuidance>>;

  return {
    disclaimer: RENOCLIMAT_FORM_ASSISTANT_DISCLAIMER,
    data,
    validation: {
      ...validation,
      issues: [...validation.issues],
    },
    guidanceByField,
    export: {
      plainText: toPlainText(data),
      json: data,
    },
    pdfReady: toPdfSections(data),
  };
}

export { FIELD_GUIDANCE };
