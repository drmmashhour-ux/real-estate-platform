import { prisma } from "@/lib/db";
import type { RetentionTemplateKey } from "./retention-templates";

const OFFSETS: { key: RetentionTemplateKey; days: number }[] = [
  { key: "retention_1w", days: 7 },
  { key: "retention_1m", days: 30 },
  { key: "retention_3m", days: 90 },
  { key: "retention_6m", days: 180 },
  { key: "retention_12m", days: 365 },
];

/** Creates pending retention rows after a lead is marked closed (won client). Idempotent per lead. */
export async function scheduleRetentionTouchpointsForLead(params: {
  leadId: string;
  brokerId: string;
  closedAt: Date;
}): Promise<number> {
  const existing = await prisma.clientRetentionTouchpoint.findFirst({
    where: { leadId: params.leadId },
  });
  if (existing) return 0;

  const base = params.closedAt.getTime();
  const data = OFFSETS.map((o) => ({
    leadId: params.leadId,
    brokerId: params.brokerId,
    scheduledFor: new Date(base + o.days * 86400000),
    templateKey: o.key,
    status: "pending",
  }));

  await prisma.clientRetentionTouchpoint.createMany({ data });
  return data.length;
}
