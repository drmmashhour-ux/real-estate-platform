import { FREE_BROKER_VISIBLE_LEADS } from "@/modules/mortgage/services/broker-lead-limits";
import { newLeadFreshnessLabel } from "@/modules/mortgage/services/lead-freshness";

export type BrokerLeadRow = {
  id: string;
  propertyPrice: number;
  intentLevel: string;
  timeline: string;
  preApproved: boolean;
  status: string;
  createdAt: string;
  locked: boolean;
  contactLocked: boolean;
  /** CAD — shown when contact is locked (unlock pricing) */
  leadValue: number;
  freshnessLabel: string;
  estimatedApprovalAmount: number | null;
  estimatedMonthlyPayment: number | null;
  approvalConfidence: string | null;
  userId?: string | null;
  downPayment?: number | null;
  income?: number | null;
  borrowerEmail?: string | null;
  borrowerPhone?: string | null;
  borrowerName?: string | null;
};

type Raw = {
  id: string;
  userId: string;
  propertyPrice: number;
  downPayment: number;
  income: number;
  status: string;
  createdAt: Date;
  intentLevel: string;
  timeline: string;
  preApproved: boolean;
  leadValue: number;
  contactUnlocked: boolean;
  unlockedByBrokerId: string | null;
  estimatedApprovalAmount: number | null;
  estimatedMonthlyPayment: number | null;
  approvalConfidence: string | null;
  user: { email: string | null; phone: string | null; name: string | null };
};

export function mapBrokerLeadRows(
  rows: Raw[],
  opts: { plan: string; isAdmin: boolean; brokerId?: string | null }
): BrokerLeadRow[] {
  return rows.map((row, index) => mapBrokerLeadRow(row, index, opts));
}

export function mapBrokerLeadRow(
  row: Raw,
  index: number,
  opts: { plan: string; isAdmin: boolean; brokerId?: string | null }
): BrokerLeadRow {
  const locked = !opts.isAdmin && opts.plan !== "pro" && index >= FREE_BROKER_VISIBLE_LEADS;
  const viewerBrokerId = opts.brokerId ?? null;
  const contactVisible =
    opts.isAdmin ||
    (row.contactUnlocked && viewerBrokerId != null && row.unlockedByBrokerId === viewerBrokerId);
  const freshnessLabel = newLeadFreshnessLabel(row.createdAt.toISOString());

  const base: BrokerLeadRow = {
    id: row.id,
    propertyPrice: row.propertyPrice,
    intentLevel: row.intentLevel,
    timeline: row.timeline,
    preApproved: row.preApproved,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    locked,
    contactLocked: !contactVisible,
    leadValue: row.leadValue,
    freshnessLabel,
    estimatedApprovalAmount: row.estimatedApprovalAmount,
    estimatedMonthlyPayment: row.estimatedMonthlyPayment,
    approvalConfidence: row.approvalConfidence,
  };

  if (contactVisible) {
    return {
      ...base,
      userId: row.userId,
      downPayment: row.downPayment,
      income: row.income,
      borrowerEmail: row.user.email,
      borrowerPhone: row.user.phone,
      borrowerName: row.user.name,
    };
  }

  return base;
}
