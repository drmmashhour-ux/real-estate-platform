import type { PlatformRole } from "@prisma/client";

import type { AlertApprovalRow } from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";

import { prisma } from "@repo/db";

export async function loadCommandCenterAlerts(userId: string, role: PlatformRole): Promise<AlertApprovalRow[]> {
  const [trustHigh, ceo, disputesUrgent] = await Promise.all([
    prisma.lecipmOperationalTrustAlert.findMany({
      where: {
        severity: "high",
        ...(isExecutiveCommandCenter(role) ? {} : { targetType: "BROKER", targetId: userId }),
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.lecipmSystemBehaviorAdjustment.findMany({
      where: { status: "PROPOSED", ...(isExecutiveCommandCenter(role) ? {} : {}) },
      orderBy: { createdAt: "desc" },
      take: isExecutiveCommandCenter(role) ? 8 : 0,
      select: { id: true, title: true, urgency: true, affectedDomain: true, createdAt: true },
    }),
    prisma.lecipmDisputeCase.findMany({
      where: {
        priority: "HIGH",
        status: { notIn: ["RESOLVED", "REJECTED"] },
        ...(isExecutiveCommandCenter(role) ?
          {}
        : {
            OR: [{ openedByUserId: userId }, { againstUserId: userId }],
          }),
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, priority: true, category: true, relatedEntityType: true, createdAt: true },
    }),
  ]);

  const rows: AlertApprovalRow[] = [];

  for (const t of trustHigh) {
    rows.push({
      id: `trust-alert:${t.id}`,
      kind: "Trust signal",
      title: t.message.slice(0, 140),
      severity: "urgent",
      href: "/dashboard/admin/trust-score",
      createdAt: t.createdAt.toISOString(),
    });
  }

  for (const p of ceo) {
    rows.push({
      id: `ceo:${p.id}`,
      kind: "AI CEO adjustment",
      title: p.title,
      severity: p.urgency?.toUpperCase?.() === "HIGH" ? "urgent" : "attention",
      href: "/dashboard/admin/ai-ceo/system-adjustments",
      createdAt: p.createdAt.toISOString(),
    });
  }

  for (const d of disputesUrgent) {
    rows.push({
      id: `dispute:${d.id}`,
      kind: "High-priority dispute",
      title: `${d.category} · ${d.relatedEntityType}`,
      severity: "urgent",
      href: `/dashboard/disputes/${d.id}`,
      createdAt: d.createdAt.toISOString(),
    });
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return rows.slice(0, 24);
}
