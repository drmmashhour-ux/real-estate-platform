import { prisma } from "@/lib/db";

export type AdminAuditRow = {
  id: string;
  actorLabel: string;
  action: string;
  target: string;
  at: Date;
};

/** Best-effort audit trail from BNHUB engine logs (extend with dedicated admin_audit table later). */
export async function getAdminAuditLog(take = 60): Promise<AdminAuditRow[]> {
  const rows = await prisma.bnhubEngineAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      decisionType: true,
      source: true,
      payloadJson: true,
      createdAt: true,
      hostUserId: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    actorLabel: r.hostUserId ? `User ${r.hostUserId.slice(0, 8)}…` : r.source,
    action: r.decisionType,
    target: typeof r.payloadJson === "object" && r.payloadJson && "target" in r.payloadJson
      ? String((r.payloadJson as Record<string, unknown>).target)
      : "—",
    at: r.createdAt,
  }));
}
