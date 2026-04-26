import type { PlatformRole } from "@prisma/client";

import type { CommandCenterFeedItem, FeedItemDomain } from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

function laneFromSeverity(s: string): CommandCenterFeedItem["statusLane"] {
  const u = s.toUpperCase();
  if (u.includes("HIGH") || u.includes("CRITICAL")) return "urgent";
  if (u.includes("MEDIUM")) return "attention";
  return "healthy";
}

function domainIcon(d: FeedItemDomain): CommandCenterFeedItem["icon"] {
  switch (d) {
    case "booking":
      return "calendar";
    case "lead":
      return "user";
    case "deal":
      return "briefcase";
    case "trust":
    case "dispute":
      return "shield";
    case "approval":
    case "autopilot":
      return "spark";
    default:
      return "chart";
  }
}

export async function loadCommandCenterFeed(userId: string, role: PlatformRole): Promise<CommandCenterFeedItem[]> {
  const dw =
    isExecutiveCommandCenter(role) ?
      {}
    : {
        brokerId: userId,
      };

  const [dealRows, leadRows, trustAlerts, disputes, ceoRows, visits] = await Promise.all([
    prisma.deal.findMany({
      where: { ...dw },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, status: true, updatedAt: true, crmStage: true },
    }),
    prisma.lecipmCrmPipelineLead.findMany({
      where: { brokerId: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.lecipmOperationalTrustAlert.findMany({
      where: isExecutiveCommandCenter(role) ? {} : { targetType: "BROKER", targetId: userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, message: true, severity: true, createdAt: true },
    }),
    prisma.lecipmDisputeCase.findMany({
      where:
        isExecutiveCommandCenter(role) ?
          {}
        : {
            OR: [{ openedByUserId: userId }, { againstUserId: userId }],
          },
      orderBy: { createdAt: "desc" },
      take: isExecutiveCommandCenter(role) ? 8 : 4,
      select: {
        id: true,
        relatedEntityType: true,
        relatedEntityId: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.lecipmSystemBehaviorAdjustment.findMany({
      where: { status: "PROPOSED" },
      orderBy: { createdAt: "desc" },
      take: isExecutiveCommandCenter(role) ? 6 : 0,
      select: { id: true, title: true, affectedDomain: true, createdAt: true },
    }),
    prisma.lecipmVisit.findMany({
      where:
        isExecutiveCommandCenter(role) ?
          {}
        : {
            brokerUserId: userId,
          },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, workflowState: true, createdAt: true },
    }),
  ]);

  const merged: CommandCenterFeedItem[] = [];

  for (const d of dealRows) {
    merged.push({
      id: `deal:${d.id}`,
      domain: "deal",
      title: `Deal updated (${d.crmStage ?? d.status})`,
      href: `/broker/residential/deals/${d.id}`,
      createdAt: d.updatedAt.toISOString(),
      statusLane: "attention",
      icon: domainIcon("deal"),
    });
  }

  for (const l of leadRows) {
    merged.push({
      id: `lead:${l.id}`,
      domain: "lead",
      title: `Lead activity · ${l.status}`,
      href: `/dashboard/lecipm/leads`,
      createdAt: l.createdAt.toISOString(),
      statusLane: "healthy",
      icon: domainIcon("lead"),
    });
  }

  for (const t of trustAlerts) {
    merged.push({
      id: `trust:${t.id}`,
      domain: "trust",
      title: t.message.slice(0, 120),
      href: isExecutiveCommandCenter(role) ? "/dashboard/admin/trust-score" : "/dashboard/broker/trust",
      createdAt: t.createdAt.toISOString(),
      statusLane: laneFromSeverity(t.severity ?? "medium"),
      icon: domainIcon("trust"),
    });
  }

  for (const c of disputes) {
    merged.push({
      id: `dispute:${c.id}`,
      domain: "dispute",
      title: `Dispute case · ${c.status}`,
      detail: `${c.relatedEntityType} · ${c.relatedEntityId.slice(0, 10)}…`,
      href: `/dashboard/disputes/${c.id}`,
      createdAt: c.createdAt.toISOString(),
      statusLane: "urgent",
      icon: domainIcon("dispute"),
    });
  }

  for (const p of ceoRows) {
    merged.push({
      id: `ceo:${p.id}`,
      domain: "autopilot",
      title: `CEO adjustment proposed · ${p.title.slice(0, 80)}`,
      detail: p.affectedDomain,
      href: "/dashboard/admin/autonomy-command-center",
      createdAt: p.createdAt.toISOString(),
      statusLane: "attention",
      icon: domainIcon("autopilot"),
    });
  }

  for (const v of visits) {
    merged.push({
      id: `visit:${v.id}`,
      domain: "booking",
      title: `Visit pipeline · ${v.workflowState}`,
      href: `/dashboard/broker/residential/leads`,
      createdAt: v.createdAt.toISOString(),
      statusLane: "healthy",
      icon: domainIcon("booking"),
    });
  }

  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return merged.slice(0, 28);
}
