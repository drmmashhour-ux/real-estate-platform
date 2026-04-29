/** Client intake + required documents — mirrored Prisma enums. */

export type RequiredDocumentCategory =
  | "IDENTITY"
  | "INCOME"
  | "BANKING"
  | "TAX"
  | "RESIDENCY"
  | "CREDIT"
  | "EMPLOYMENT"
  | "CORPORATE"
  | "PROPERTY"
  | "OTHER";

export type RequiredDocumentStatus =
  | "REQUIRED"
  | "REQUESTED"
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "WAIVED";

export type ClientIntakeEventType =
  | "INTAKE_CREATED"
  | "INTAKE_UPDATED"
  | "STATUS_CHANGED"
  | "DOCUMENT_REQUESTED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_LINKED"
  | "DOCUMENT_APPROVED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_WAIVED"
  | "NOTE_ADDED";
