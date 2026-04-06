/**
 * Broker must not read arbitrary leads — only those they introduced / follow up on,
 * or explicitly shared platform sources (evaluation / broker consultation).
 */
export function canBrokerOrAdminAccessLead(
  role: string | undefined,
  viewerId: string,
  lead: {
    introducedByBrokerId: string | null;
    lastFollowUpByBrokerId: string | null;
    leadSource: string | null;
  }
): boolean {
  if (role === "ADMIN") return true;
  if (role !== "BROKER") return false;
  const shared = lead.leadSource === "evaluation_lead" || lead.leadSource === "broker_consultation";
  return (
    lead.introducedByBrokerId === viewerId ||
    lead.lastFollowUpByBrokerId === viewerId ||
    shared
  );
}
