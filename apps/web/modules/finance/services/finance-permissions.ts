import type { Tenant } from "@prisma/client";
import { membershipHasCapability, type TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export function canViewFinance(user: TenantSubject, tenant: Tenant): boolean {
  return membershipHasCapability(user, tenant, "finance.view");
}

export function canManageFinance(user: TenantSubject, tenant: Tenant): boolean {
  return membershipHasCapability(user, tenant, "finance.manage");
}

export function canApproveCommission(user: TenantSubject, tenant: Tenant): boolean {
  return membershipHasCapability(user, tenant, "finance.commission_approve");
}

export function canIssueInvoice(user: TenantSubject, tenant: Tenant): boolean {
  return membershipHasCapability(user, tenant, "finance.invoice_issue");
}

export function canRecordPayment(user: TenantSubject, tenant: Tenant): boolean {
  return membershipHasCapability(user, tenant, "finance.payment_record");
}
