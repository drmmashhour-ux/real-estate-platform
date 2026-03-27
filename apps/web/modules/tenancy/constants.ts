import type { TenantRole } from "@prisma/client";

/** Human-readable labels for UI copy. */
export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
  TENANT_OWNER: "Workspace owner",
  TENANT_ADMIN: "Admin",
  BROKER: "Broker",
  ASSISTANT: "Assistant",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

/**
 * Capability flags for tenant roles (server-side enforcement; UI may mirror for UX only).
 */
export type TenantCapability =
  | "tenant.settings"
  | "tenant.members"
  | "tenant.billing_profile"
  | "tenant.analytics"
  | "finance.view"
  | "finance.manage"
  | "finance.commission_approve"
  | "finance.invoice_issue"
  | "finance.payment_record";

const OWNER_CAPS: TenantCapability[] = [
  "tenant.settings",
  "tenant.members",
  "tenant.billing_profile",
  "tenant.analytics",
  "finance.view",
  "finance.manage",
  "finance.commission_approve",
  "finance.invoice_issue",
  "finance.payment_record",
];

const ADMIN_CAPS: TenantCapability[] = [
  "tenant.settings",
  "tenant.members",
  "tenant.billing_profile",
  "tenant.analytics",
  "finance.view",
  "finance.manage",
  "finance.commission_approve",
  "finance.invoice_issue",
  "finance.payment_record",
];

/** Maps each role to capabilities granted inside an ACTIVE membership. */
export const TENANT_ROLE_CAPABILITIES: Record<TenantRole, TenantCapability[]> = {
  TENANT_OWNER: OWNER_CAPS,
  TENANT_ADMIN: ADMIN_CAPS,
  BROKER: [
    "tenant.analytics",
    "finance.view",
    "finance.manage",
    "finance.invoice_issue",
    "finance.payment_record",
  ],
  ASSISTANT: [
    "tenant.analytics",
    "finance.view",
    "finance.manage",
    "finance.invoice_issue",
    "finance.payment_record",
  ],
  STAFF: ["finance.view", "tenant.analytics"],
  VIEWER: ["finance.view", "tenant.analytics"],
};

export function tenantRoleHasCapability(role: TenantRole, cap: TenantCapability): boolean {
  return TENANT_ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
}
