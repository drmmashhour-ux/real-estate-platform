/** Deep links / IDs for CRM surfaces — no PII in return (callers add names server-side). */
export function brokerCrmLeadDeepLink(leadId: string): { webPath: string } {
  return { webPath: `/dashboard/broker/clients/${encodeURIComponent(leadId)}` };
}
