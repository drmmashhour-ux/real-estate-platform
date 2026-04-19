/**
 * First-hit milestones — dates from CRM when available; booleans always from aggregates.
 */

import { prisma } from "@/lib/db";
import type { BrokerMilestone } from "./broker-incentives.types";
import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";

function iso(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

export async function computeBrokerMilestones(
  brokerId: string,
  metrics: BrokerPerformanceMetrics,
): Promise<BrokerMilestone[]> {
  const whereBroker = {
    OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
  };

  const [firstContactLead, firstQualified, firstMeeting, firstWin] = await Promise.all([
    prisma.lead.findFirst({
      where: whereBroker,
      orderBy: { firstContactAt: "asc" },
      select: { firstContactAt: true },
    }),
    prisma.lead.findFirst({
      where: whereBroker,
      orderBy: { qualifiedAt: "asc" },
      select: { qualifiedAt: true },
    }),
    prisma.lead.findFirst({
      where: whereBroker,
      orderBy: { meetingScheduledAt: "asc" },
      select: { meetingScheduledAt: true, meetingAt: true },
    }),
    prisma.lead.findFirst({
      where: { ...whereBroker, wonAt: { not: null } },
      orderBy: { wonAt: "asc" },
      select: { wonAt: true },
    }),
  ]);

  const firstMeetingAt = firstMeeting?.meetingScheduledAt ?? firstMeeting?.meetingAt;

  const milestones: BrokerMilestone[] = [
    {
      id: "first_contact",
      label: "First outreach",
      description: "Logged first contact on an assigned lead.",
      achieved: metrics.leadsContacted >= 1,
      achievedAt: metrics.leadsContacted >= 1 ? iso(firstContactLead?.firstContactAt) : undefined,
    },
    {
      id: "first_response",
      label: "First reply signal",
      description: "Lead shows responded engagement in CRM.",
      achieved: metrics.leadsResponded >= 1,
      achievedAt: metrics.leadsResponded >= 1 ? iso(firstQualified?.qualifiedAt) : undefined,
    },
    {
      id: "first_meeting",
      label: "First meeting step",
      description: "Pipeline reaches a meeting stage.",
      achieved: metrics.meetingsMarked >= 1,
      achievedAt: metrics.meetingsMarked >= 1 ? iso(firstMeetingAt) : undefined,
    },
    {
      id: "first_win",
      label: "First recorded win",
      description: "A deal marked won in CRM (advisory — not a payment guarantee).",
      achieved: metrics.wonDeals >= 1,
      achievedAt: metrics.wonDeals >= 1 ? iso(firstWin?.wonAt) : undefined,
    },
    {
      id: "ten_leads_handled",
      label: "10 leads in workspace",
      description: "Healthy sample size for coaching signals.",
      achieved: metrics.leadsAssigned >= 10,
    },
    {
      id: "five_followups_logged",
      label: "Five follow-ups logged",
      description: "Repeated logged follow-up touches (`lastFollowUpAt`).",
      achieved: metrics.followUpsCompleted >= 5,
    },
  ];

  return milestones;
}

/** Lightweight milestone scan without extra prisma — used when DB dates optional */
export function computeBrokerMilestonesFromMetricsOnly(metrics: BrokerPerformanceMetrics): BrokerMilestone[] {
  return [
    {
      id: "first_contact",
      label: "First outreach",
      description: "Logged first contact on an assigned lead.",
      achieved: metrics.leadsContacted >= 1,
    },
    {
      id: "first_response",
      label: "First reply signal",
      description: "Lead shows responded engagement in CRM.",
      achieved: metrics.leadsResponded >= 1,
    },
    {
      id: "first_meeting",
      label: "First meeting step",
      description: "Pipeline reaches a meeting stage.",
      achieved: metrics.meetingsMarked >= 1,
    },
    {
      id: "first_win",
      label: "First recorded win",
      achieved: metrics.wonDeals >= 1,
      description: "A deal marked won in CRM.",
    },
    {
      id: "ten_leads_handled",
      label: "10 leads in workspace",
      description: "Healthy sample size for coaching signals.",
      achieved: metrics.leadsAssigned >= 10,
    },
    {
      id: "five_followups_logged",
      label: "Five follow-ups logged",
      description: "Repeated logged follow-up touches.",
      achieved: metrics.followUpsCompleted >= 5,
    },
  ];
}
