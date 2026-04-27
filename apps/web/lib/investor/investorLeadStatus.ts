/** Pipeline labels (InvestorLead.status) — Order 51.1 */
export const INVESTOR_LEAD_STATUSES = ["new", "contacted", "replied", "meeting", "closed"] as const;
export type InvestorLeadStatus = (typeof INVESTOR_LEAD_STATUSES)[number];

export function isValidInvestorLeadStatus(s: string): s is InvestorLeadStatus {
  return (INVESTOR_LEAD_STATUSES as readonly string[]).includes(s);
}
