import { prisma } from "@/lib/db";

export type LegalPolicyRecordRow = {
  ruleCode: string;
  result: string;
  reason: string | null;
  createdAt: Date;
  domain: string;
  legalGateAction?: string;
  blockingSample?: string[];
};

/**
 * Read recent policy records and filter in-app for `metadataJson.domain === "legal"`.
 * (Prisma JSON path filters vary by driver; in-memory filter is deterministic and safe for admin UI volumes.)
 */
export async function loadLegalPolicyRecordStats(): Promise<{
  totalLegal: number;
  blocked: number;
  warning: number;
  topBlockingKeys: { key: string; count: number }[];
  recent: LegalPolicyRecordRow[];
} | null> {
  try {
    const rows = await prisma.autonomousMarketplacePolicyRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        ruleCode: true,
        result: true,
        reason: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    const legal = rows.filter((r) => {
      const m = r.metadataJson as Record<string, unknown> | null;
      return m?.domain === "legal";
    });

    const blocked = legal.filter((r) => r.result === "blocked").length;
    const warning = legal.filter((r) => r.result === "warning").length;
    const keyCount: Record<string, number> = {};
    for (const r of legal) {
      if (r.result !== "blocked") continue;
      const m = r.metadataJson as { blockingRequirements?: string[] } | null;
      const br = m?.blockingRequirements;
      if (!Array.isArray(br)) continue;
      for (const k of br) {
        keyCount[k] = (keyCount[k] ?? 0) + 1;
      }
    }
    const topBlockingKeys = Object.entries(keyCount)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recent: LegalPolicyRecordRow[] = legal.slice(0, 20).map((r) => {
      const m = r.metadataJson as Record<string, unknown> | null;
      const br = m?.blockingRequirements;
      return {
        ruleCode: r.ruleCode,
        result: r.result,
        reason: r.reason,
        createdAt: r.createdAt,
        domain: "legal",
        legalGateAction: typeof m?.legalGateAction === "string" ? m.legalGateAction : undefined,
        blockingSample: Array.isArray(br) ? (br as string[]).slice(0, 5) : undefined,
      };
    });

    return {
      totalLegal: legal.length,
      blocked,
      warning,
      topBlockingKeys,
      recent,
    };
  } catch {
    return null;
  }
}
