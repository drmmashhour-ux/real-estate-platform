export type TurboDraftRole = "BUYER" | "SELLER" | "TENANT" | "LANDLORD" | "BROKER" | "ADMIN";
export type TurboTransactionType = "SALE" | "RENT" | "LEASE" | "COMMERCIAL_SALE" | "COMMERCIAL_LEASE";
export type TurboPropertyType = "RESIDENTIAL" | "CONDO" | "PLEX" | "COMMERCIAL" | "LAND" | "INDUSTRIAL";
export type TurboLocale = "fr" | "en";
export type TurboSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface TurboParty {
  id: string;
  role: string;
  name: string;
  email?: string;
  address?: string;
  representedBy?: string; // Broker name or ID
}

export interface TurboProperty {
  address: string;
  city: string;
  cadastre?: string;
  type: TurboPropertyType;
}

export interface TurboDraftInput {
  userId?: string;
  draftId?: string;
  formKey: string;
  role: TurboDraftRole;
  transactionType: TurboTransactionType;
  propertyType: TurboPropertyType;
  representedStatus: "REPRESENTED" | "NOT_REPRESENTED" | "PARTIAL";
  parties: TurboParty[];
  property: TurboProperty;
  answers: Record<string, any>;
  locale: TurboLocale;
}

export interface TurboDraftContext extends TurboDraftInput {
  timestamp: string;
}

export interface TurboDraftSection {
  id: string;
  title: string;
  content: string;
  isMandatory: boolean;
}

export interface TurboDraftRisk {
  ruleKey: string;
  severity: TurboSeverity;
  messageFr: string;
  messageEn: string;
  blocking: boolean;
}

export interface TurboDraftNotice {
  noticeKey: string;
  title: string;
  content: string;
  severity: TurboSeverity;
  acknowledged?: boolean;
}

export interface TurboDraftResult {
  draftId?: string;
  formKey: string;
  title: string;
  sections: TurboDraftSection[];
  notices: TurboDraftNotice[];
  risks: TurboDraftRisk[];
  canProceed: boolean;
  blockingReasons: string[];
  auditId?: string;
}

export type TurboFieldType =
  | "text"
  | "textarea"
  | "money"
  | "date"
  | "boolean"
  | "select"
  | "multiSelect"
  | "address"
  | "party"
  | "fileUpload";

export interface TurboField {
  key: string;
  label: string;
  type: TurboFieldType;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface TurboFormStep {
  id: string;
  title: string;
  fieldKeys: string[];
}

export interface TurboFormTemplate {
  formKey: string;
  title: string;
  jurisdiction: "QC";
  transactionType: TurboTransactionType;
  fields: TurboField[];
  steps: TurboFormStep[];
  requiredNotices: string[];
  outputSections: string[];
}
