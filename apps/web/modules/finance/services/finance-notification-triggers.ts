import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { createActionQueueItem } from "@/modules/notifications/services/action-queue";

type Base = {
  tenantId: string;
  userId: string;
  offerId?: string | null;
  contractId?: string | null;
};

export async function notifyInvoiceIssued(params: Base & { invoiceNumber: string; tenantInvoiceId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Invoice issued",
    message: `Invoice ${params.invoiceNumber} was issued.`,
    tenantId: params.tenantId,
    offerId: params.offerId ?? undefined,
    contractId: params.contractId ?? undefined,
    metadata: { kind: "invoice_issued", tenantInvoiceId: params.tenantInvoiceId } as Prisma.InputJsonValue,
  }).catch(() => {});
}

export async function notifyInvoiceOverdue(params: Base & { invoiceNumber: string; tenantInvoiceId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Invoice overdue",
    message: `Invoice ${params.invoiceNumber} is overdue.`,
    tenantId: params.tenantId,
    offerId: params.offerId ?? undefined,
    contractId: params.contractId ?? undefined,
    metadata: { kind: "invoice_overdue", tenantInvoiceId: params.tenantInvoiceId } as Prisma.InputJsonValue,
  }).catch(() => {});
}

export async function notifyCommissionPendingApproval(params: Base & { dealFinancialId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Commission pending approval",
    message: "A commission split is waiting for approval.",
    tenantId: params.tenantId,
    offerId: params.offerId ?? undefined,
    contractId: params.contractId ?? undefined,
    metadata: { kind: "commission_pending", dealFinancialId: params.dealFinancialId } as Prisma.InputJsonValue,
  }).catch(() => {});
  await createActionQueueItem({
    userId: params.userId,
    type: "REVIEW_COMMISSION",
    title: "Review commission",
    description: "Approve or adjust commission splits for this deal.",
    tenantId: params.tenantId,
    sourceType: "deal_financial",
    sourceId: params.dealFinancialId,
    actionUrl: `/dashboard/finance/commissions/${params.dealFinancialId}`,
  }).catch(() => {});
}

export async function notifyCommissionApproved(params: Base & { dealFinancialId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Commission approved",
    message: "Commission splits were approved.",
    tenantId: params.tenantId,
    metadata: { kind: "commission_approved", dealFinancialId: params.dealFinancialId } as Prisma.InputJsonValue,
  }).catch(() => {});
}

export async function notifyCommissionPaid(params: Base & { splitId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Commission paid",
    message: "A commission payout was marked paid.",
    tenantId: params.tenantId,
    metadata: { kind: "commission_paid", splitId: params.splitId } as Prisma.InputJsonValue,
  }).catch(() => {});
}

export async function notifyPaymentFailed(params: Base & { reason?: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Payment failed",
    message: params.reason ?? "A payment record failed or was cancelled.",
    tenantId: params.tenantId,
    metadata: { kind: "payment_failed" } as Prisma.InputJsonValue,
  }).catch(() => {});
}

export async function notifyBillingProfileIncomplete(params: { tenantId: string; userId: string }) {
  await createNotification({
    userId: params.userId,
    type: "FINANCE",
    title: "Billing profile incomplete",
    message: "Add legal name and billing email for this workspace when ready.",
    tenantId: params.tenantId,
    metadata: { kind: "billing_profile_incomplete" } as Prisma.InputJsonValue,
  }).catch(() => {});
  await createActionQueueItem({
    userId: params.userId,
    type: "INTERNAL_TASK",
    title: "Complete billing profile",
    description: "Workspace billing details help with future SaaS invoices.",
    tenantId: params.tenantId,
    sourceType: "tenant_billing",
    sourceId: params.tenantId,
    actionUrl: `/dashboard/tenant/settings`,
  }).catch(() => {});
}

/** Notify finance admins on a tenant: owners + tenant admins (best-effort). */
export async function notifyTenantFinanceUsers(
  tenantId: string,
  build: (userId: string) => Promise<void>
): Promise<void> {
  const members = await prisma.tenantMembership.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      role: { in: ["TENANT_OWNER", "TENANT_ADMIN", "BROKER"] },
    },
    select: { userId: true },
    take: 25,
  });
  for (const m of members) {
    await build(m.userId);
  }
}
