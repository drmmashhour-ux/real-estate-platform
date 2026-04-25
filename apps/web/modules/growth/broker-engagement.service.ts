import { prisma } from "@/lib/db";
import { isBrokerActive } from "./broker-activity.service";

export type BrokerEngagementItem = {
  id: string;
  kind: "high_priority" | "new_lead" | "deal_risk";
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
};

/**
 * In-app engagement copy (no email). Derived from real CRM rows where possible.
 */
export async function getBrokerEngagementItems(brokerId: string): Promise<BrokerEngagementItem[]> {
  const [openLeads, dealAtRisk, active] = await Promise.all([
    prisma.lecipmBrokerCrmLead.count({
      where: { brokerUserId: brokerId, status: { in: ["new", "contacted", "qualified"] } },
    }),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        brokerUserId: brokerId,
        nextFollowUpAt: { lt: new Date() },
        status: { in: ["visit_scheduled", "negotiating", "qualified"] },
      },
    }),
    isBrokerActive(brokerId),
  ]);

  const items: BrokerEngagementItem[] = [];

  if (openLeads >= 2) {
    items.push({
      id: "hp-deals",
      kind: "high_priority",
      title: "You have high-priority work in your queue",
      detail:
        openLeads >= 3
          ? `You have ${openLeads} active leads — pick the best next touch.`
          : `You have ${openLeads} active leads to work today.`,
      ctaLabel: "Open CRM",
      ctaHref: "/dashboard/crm",
    });
  } else if (openLeads >= 1) {
    items.push({
      id: "new-lead",
      kind: "new_lead",
      title: "New lead activity in your pipeline",
      detail: "Review the latest inquiry and set a follow-up time.",
      ctaLabel: "Review leads",
      ctaHref: "/dashboard/crm",
    });
  } else {
    items.push({
      id: "new-lead",
      kind: "new_lead",
      title: "New lead available in your area",
      detail: "When listings generate inquiries, they land here first.",
      ctaLabel: "Open pipeline",
      ctaHref: "/dashboard/crm",
    });
  }

  if (dealAtRisk > 0) {
    items.push({
      id: "at-risk",
      kind: "deal_risk",
      title: "Deal at risk",
      detail:
        dealAtRisk === 1
          ? "One active opportunity has a follow-up date in the past."
          : `${dealAtRisk} opportunities need a follow-up to stay on track.`,
      ctaLabel: "See deals",
      ctaHref: "/dashboard/crm",
    });
  } else {
    items.push({
      id: "tip",
      kind: "deal_risk",
      title: "Keep momentum",
      detail: !active
        ? "View three leads or use an AI suggestion to mark your workspace active."
        : "Schedule follow-ups on warm leads to protect your close rate.",
      ctaLabel: "CRM",
      ctaHref: "/dashboard/crm",
    });
  }

  return items.slice(0, 3);
}
