/**
 * Client-safe mirror of Prisma `PrivacyPurpose` — do not import `@prisma/client` in `"use client"` trees.
 *
 * Keep in sync with `enum PrivacyPurpose` in `prisma/schema.prisma`.
 */
export type PrivacyPurpose =
  | "TRANSACTION_EXECUTION"
  | "IDENTITY_VERIFICATION"
  | "DISCLOSURE_TO_BROKERS"
  | "DISCLOSURE_TO_INFORMATION_DISSEMINATION_SERVICE"
  | "DISCLOSURE_TO_BUYER_BROKER"
  | "DISCLOSURE_TO_UNREPRESENTED_BUYER"
  | "MARKETING"
  | "COMMERCIAL_PROSPECTING"
  | "SECONDARY_USE"
  | "LOCKBOX_CODE_DISCLOSURE"
  | "ALARM_CODE_DISCLOSURE"
  | "PHONE_DISCLOSURE_FOR_VISIT"
  | "SOLD_PRICE_DISCLOSURE_TO_LICENSE_HOLDERS";
