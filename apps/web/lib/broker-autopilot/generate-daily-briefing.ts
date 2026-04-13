import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { prisma } from "@/lib/db";
import { brokerCrmKpis } from "@/lib/broker-crm/list-leads";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";
import { listOpenAutopilotActions } from "@/lib/broker-autopilot/list-actions";
import { getOrCreateBrokerAutopilotSettings } from "@/lib/broker-autopilot/get-settings";

const MODEL = "gpt-4o-mini";

function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function generateDailyBriefingForBroker(brokerUserId: string, isAdmin: boolean) {
  const now = new Date();
  const day = utcDateOnly(now);
  const settings = await getOrCreateBrokerAutopilotSettings(brokerUserId);
  if (!settings.dailyDigestEnabled) {
    return prisma.lecipmBrokerDailyBriefing.upsert({
      where: {
        brokerUserId_briefingDate: { brokerUserId, briefingDate: day },
      },
      create: {
        brokerUserId,
        briefingDate: day,
        summary: "Daily digest is turned off in Autopilot settings.",
        highPriorityCount: 0,
        followupsDueCount: 0,
        overdueCount: 0,
        topActionsJson: {},
      },
      update: {
        summary: "Daily digest is turned off in Autopilot settings.",
      },
    });
  }

  const [kpis, actions, leads] = await Promise.all([
    brokerCrmKpis(brokerUserId, isAdmin),
    listOpenAutopilotActions({ brokerUserId, isAdmin, take: 20 }),
    prisma.lecipmBrokerCrmLead.findMany({
      where: isAdmin ? {} : { brokerUserId },
      take: 80,
      orderBy: { updatedAt: "desc" },
      include: {
        listing: { select: { title: true, listingCode: true } },
        thread: { select: { lastMessageAt: true } },
        customer: { select: { name: true, email: true } },
      },
    }),
  ]);

  const highPriorityCount = await prisma.lecipmBrokerCrmLead.count({
    where: {
      ...(isAdmin ? {} : { brokerUserId }),
      priorityLabel: "high",
      status: { notIn: ["closed", "lost"] },
    },
  });

  const overdueCount = await prisma.lecipmBrokerCrmLead.count({
    where: {
      ...(isAdmin ? {} : { brokerUserId }),
      status: { notIn: ["closed", "lost"] },
      nextFollowUpAt: { lt: now },
    },
  });

  const topLeadSnippets = leads.slice(0, 12).map((l) => ({
    id: l.id,
    name: l.customer?.name || l.guestName || "Lead",
    status: l.status,
    priority: l.priorityLabel,
    listing: l.listing?.listingCode ?? "",
  }));

  const actionSnippets = actions.slice(0, 8).map((a) => ({
    title: a.title,
    leadId: a.leadId,
    type: a.actionType,
  }));

  let summary: string;
  if (!isOpenAiConfigured() || !openai) {
    summary = `You have ${kpis.newLeads} new leads, ${highPriorityCount} high-priority open leads, and ${kpis.followUpsDueToday} follow-ups due today. ${actions.length} autopilot suggestions are queued — review the list and act on the hottest threads first.`;
  } else {
    const system = `You write a concise daily briefing for a real-estate broker (3–5 sentences).
Output JSON: {"summary":string}
Do not invent numbers — use only the structured stats provided. Mention priorities and risks briefly.`;

    const user = JSON.stringify({
      stats: {
        newLeads: kpis.newLeads,
        highPriority: highPriorityCount,
        followUpsDueToday: kpis.followUpsDueToday,
        overdueFollowUps: overdueCount,
        openAutopilotSuggestions: actions.length,
      },
      topLeads: topLeadSnippets,
      autopilotActions: actionSnippets,
    });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      const j = JSON.parse(raw) as { summary?: string };
      summary = typeof j.summary === "string" && j.summary.trim() ? j.summary.trim() : "";
    } catch {
      summary = "";
    }
    if (!summary) {
      summary = `Daily snapshot: ${kpis.newLeads} new leads, ${highPriorityCount} high priority, ${actions.length} autopilot suggestions. Triage follow-ups due today first.`;
    }
  }

  const topActionsJson = {
    leads: topLeadSnippets.slice(0, 3),
    actions: actionSnippets.slice(0, 3),
  };

  const row = await prisma.lecipmBrokerDailyBriefing.upsert({
    where: {
      brokerUserId_briefingDate: { brokerUserId, briefingDate: day },
    },
    create: {
      brokerUserId,
      briefingDate: day,
      summary,
      highPriorityCount,
      followupsDueCount: kpis.followUpsDueToday,
      overdueCount,
      topActionsJson,
    },
    update: {
      summary,
      highPriorityCount,
      followupsDueCount: kpis.followUpsDueToday,
      overdueCount,
      topActionsJson,
    },
  });

  trackBrokerAutopilot("broker_autopilot_daily_briefing_generated", { day: day.toISOString() }, { userId: brokerUserId });

  return row;
}
