import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export type PrivatePacketAuditAction =
  | "packet_generation_blocked"
  | "packet_generated"
  | "packet_approved"
  | "packet_released"
  | "packet_version_exported";

export async function recordPrivatePacketAudit(input: {
  dealId: string;
  packetId?: string | null;
  investorId?: string | null;
  actorUserId?: string | null;
  action: PrivatePacketAuditAction | string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.privateInvestorPacketAuditLog.create({
      data: {
        dealId: input.dealId,
        packetId: input.packetId ?? null,
        investorId: input.investorId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        metadata: input.metadata ?? {},
      },
    });
  } catch {
    // Non-fatal
  }
}

export function snapshotHashForPacket(summaryJson: unknown): string {
  return createHash("sha256").update(JSON.stringify(summaryJson), "utf8").digest("hex");
}
