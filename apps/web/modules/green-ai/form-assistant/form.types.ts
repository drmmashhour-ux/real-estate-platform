/**
 * Internal draft data for preparing Rénoclimat-related paperwork — never submitted by LECIPM.
 */

export const RENOCLIMAT_FORM_ASSISTANT_DISCLAIMER =
  "LECIPM assists in preparing your application but does not submit it to Rénoclimat.";

export type RenoclimatFormDraft = {
  ownerName: string;
  address: string;
  municipality?: string;
  postalCode?: string;
  propertyType: string;
  yearBuilt?: number | null;
  heatingSystem: string;
  insulation: string;
  windows?: string;
  plannedUpgrades: string[];
  /** Optional free-text notes for your own filing */
  additionalNotes?: string;
};

export type FormFieldId = keyof RenoclimatFormDraft | "plannedUpgrades";

export type FieldGuidance = {
  fieldId: FormFieldId;
  label: string;
  explanation: string;
  example: string;
};

export type FieldValidationIssue = {
  fieldId: FormFieldId;
  severity: "error" | "warning";
  message: string;
};

export type FormAssistantValidation = {
  /** True when required fields are present enough to prep a draft */
  isReady: boolean;
  missingFields: FormFieldId[];
  issues: FieldValidationIssue[];
};

/** Copy-ready plain text block */
export type FormExportFormat = {
  plainText: string;
  json: RenoclimatFormDraft;
};

/** PDF-ready blocks (paragraphs per logical section) */
export type PdfReadyFormSection = {
  title: string;
  lines: string[];
};

export type FormAssistantOutput = {
  disclaimer: typeof RENOCLIMAT_FORM_ASSISTANT_DISCLAIMER;
  data: RenoclimatFormDraft;
  validation: FormAssistantValidation;
  guidanceByField: Partial<Record<FormFieldId, FieldGuidance>>;
  export: FormExportFormat;
  pdfReady: PdfReadyFormSection[];
};

export type FormAssistantInput = {
  ownerName?: string | null;
  ownerEmail?: string | null;
  /** Full mailing / civic address */
  address?: string | null;
  municipality?: string | null;
  postalCode?: string | null;
  propertyType?: string | null;
  yearBuilt?: number | null;
  /** Maps to heating profile */
  heatingType?: string | null;
  insulationQuality?: string | null;
  windowsQuality?: string | null;
  /** Engine / pipeline upgrade lines */
  plannedUpgrades?: string[];
  /** Optional notes */
  additionalNotes?: string | null;
};
