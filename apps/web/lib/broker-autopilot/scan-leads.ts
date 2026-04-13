import { prisma } from "@/lib/db";
import { evaluateLeadAutopilotRules } from "@/lib/broker-autopilot/rules";
import { getOrCreateBrokerAutopilotSettings } from "@/lib/broker-autopilot/get-settings";
import { insertAutopilotAction } from "@/lib/broker-autopilot/generate-action";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

export async function scanBrokerAutopilotLeads(brokerUserId: string, isAdmin: boolean): Promise<{
  created: number;
  examined: number;
  skippedPaused: boolean;
}> {
  const settings = await getOrCreateBrokerAutopilotSettings(brokerUserId);
  const now = new Date();

  if (settings.mode === "off") {
    return { created: 0, examined: 0, skippedPaused: true };
  }
  if (settings.pauseUntil && settings.pauseUntil.getTime() > now.getTime()) {
    return { created: 0, examined: 0, skippedPaused: true };
  }

  const base = isAdmin ? {} : { brokerUserId };
  const leads = await prisma.lecipmBrokerCrmLead.findMany({
    where: {
      ...base,
      status: { notIn: ["closed", "lost"] },
    },
    take: 150,
    orderBy: { updatedAt: "desc" },
    include: {
      thread: {
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 200 },
        },
      },
    },
  });

  let created = 0;
  const aiDraftBudget = { remaining: 5, decrement() { this.remaining -= 1; } };

  for (const lead of leads) {
    if (!lead.thread) continue;

    const messages = lead.thread.messages;
    const threadLastMessageAt = lead.thread.lastMessageAt;

    const candidates = evaluateLeadAutopilotRules({
      lead,
      messages,
      now,
      autoSuggestVisits: settings.autoSuggestVisits,
    });

    for (const candidate of candidates) {
      const ok = await insertAutopilotAction({
        brokerUserId,
        leadId: lead.id,
        threadId: lead.thread.id,
        candidate,
        threadLastMessageAt,
        autoDraftFollowups: settings.autoDraftFollowups,
        aiDraftBudget,
      });
      if (ok) created += 1;
    }
  }

  trackBrokerAutopilot(
    "broker_autopilot_scan_run",
    { examined: leads.length, created },
    { userId: brokerUserId }
  );

  return { created, examined: leads.length, skippedPaused: false };
}
