/** Tenant workspace + finance rows — mirrored Prisma enums for UI bundles. */

export type TenantRole =
  | "TENANT_OWNER"
  | "TENANT_ADMIN"
  | "BROKER"
  | "ASSISTANT"
  | "STAFF"
  | "VIEWER";

export type TenantMembershipStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";

export type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

export type TenantInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type TenantInvoiceType =
  | "COMMISSION"
  | "SERVICE_FEE"
  | "BROKER_FEE"
  | "PLATFORM_FEE"
  | "OTHER";

export type PaymentRecordType = "INCOMING" | "OUTGOING" | "ADJUSTMENT";

export type PaymentRecordStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
