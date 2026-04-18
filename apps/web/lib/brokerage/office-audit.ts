import { prisma } from "@/lib/db";

export const brokerageOfficeAuditKeys = {
  memberAdded: "brokerage_office.member.added",
  memberUpdated: "brokerage_office.member.updated",
  settingsUpdated: "brokerage_office.settings.updated",
  commissionPlanChanged: "brokerage_office.commission_plan.changed",
  commissionCaseCreated: "brokerage_office.commission_case.created",
  commissionApproved: "brokerage_office.commission.approved",
  commissionDisputed: "brokerage_office.commission.disputed",
  invoiceIssued: "brokerage_office.invoice.issued",
  invoicePaid: "brokerage_office.invoice.paid",
  payoutCreated: "brokerage_office.payout.created",
  payoutApproved: "brokerage_office.payout.approved",
  payoutPaid: "brokerage_office.payout.paid",
} as const;

export async function logBrokerageOfficeAudit(input: {
  officeId: string;
  actorUserId: string;
  actionKey: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.brokerageOfficeAuditLog.create({
    data: {
      officeId: input.officeId,
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      payload: (input.payload ?? {}) as object,
    },
  });
}
