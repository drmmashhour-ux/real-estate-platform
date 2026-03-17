import { config } from "../config.js";
import { triageSupport } from "../services/operator-service.js";

export async function runSupportTriageRefresh(): Promise<{ processed: number }> {
  const ticketsUrl = process.env.SUPPORT_TICKETS_URL || config.messagingServiceUrl;
  if (!ticketsUrl) {
    console.log("[support-triage-refresh] No support tickets URL; skip.");
    return { processed: 0 };
  }
  try {
    const res = await fetch(`${ticketsUrl}/tickets?status=open&limit=30`);
    const data = res.ok ? await res.json() : { tickets: [] };
    const tickets = Array.isArray(data) ? data : data.tickets ?? [];
    for (const t of tickets) {
      triageSupport({
        ticketId: t.id,
        subject: t.subject,
        body: t.body ?? t.description ?? "",
      });
    }
    console.log("[support-triage-refresh] Processed", tickets.length, "tickets");
    return { processed: tickets.length };
  } catch (e) {
    console.error("[support-triage-refresh]", e);
    return { processed: 0 };
  }
}
