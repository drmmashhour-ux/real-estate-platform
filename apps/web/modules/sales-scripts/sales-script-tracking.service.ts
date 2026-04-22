import { prisma } from "@/lib/db";

import { notifyAcquisitionAdmins } from "@/modules/acquisition/acquisition-notifications.service";

import type { CallLogInput, SalesScriptCategory, ScriptConversionStats } from "./sales-script.types";
import { getVariantMetadata } from "./sales-script-variants.service";
import type { ScriptContext } from "./sales-script.types";

export async function logSalesCall(input: CallLogInput) {
  const row = await prisma.salesScriptCallLog.create({
    data: {
      contactId: input.contactId ?? null,
      audience: input.audience,
      scriptCategory: input.scriptCategory,
      variantKey: input.variantKey,
      outcome: input.outcome,
      objectionsEncountered:
        input.objectionsEncountered && input.objectionsEncountered.length > 0
          ? input.objectionsEncountered
          : undefined,
      notes: input.notes ?? null,
      performedByUserId: input.performedByUserId ?? null,
    },
  });

  if (input.audience === "BROKER" && input.outcome === "DEMO") {
    await notifyAcquisitionAdmins("broker_demo_booked_call", {
      scriptCategory: input.scriptCategory,
      contactId: input.contactId,
      callLogId: row.id,
    });
  } else if (input.outcome === "DEMO" || input.outcome === "CLOSED") {
    await notifyAcquisitionAdmins("sales_script_conversion", {
      outcome: input.outcome,
      scriptCategory: input.scriptCategory,
      audience: input.audience,
      contactId: input.contactId,
      callLogId: row.id,
    });
  }

  if (input.audience === "INVESTOR" && input.outcome === "INTERESTED") {
    await notifyAcquisitionAdmins("investor_interest_call", {
      scriptCategory: input.scriptCategory,
      contactId: input.contactId,
      callLogId: row.id,
    });
  }

  return row;
}

export async function getConversionStats(sinceDays = 90): Promise<ScriptConversionStats> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const rows = await prisma.salesScriptCallLog.findMany({
    where: { createdAt: { gte: since } },
    select: { scriptCategory: true, outcome: true, objectionsEncountered: true },
  });

  const byCategory: ScriptConversionStats["byCategory"] = {};
  const objectionCounts = new Map<string, number>();

  for (const r of rows) {
    const cat = r.scriptCategory;
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, byOutcome: {} };
    }
    byCategory[cat].total += 1;
    byCategory[cat].byOutcome[r.outcome] = (byCategory[cat].byOutcome[r.outcome] ?? 0) + 1;

    const obs = r.objectionsEncountered;
    if (Array.isArray(obs)) {
      for (const o of obs) {
        if (typeof o === "string" && o.trim()) {
          const k = o.trim().toLowerCase();
          objectionCounts.set(k, (objectionCounts.get(k) ?? 0) + 1);
        }
      }
    }
  }

  const topObjections = [...objectionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, count]) => ({ label, count }));

  return { byCategory, topObjections };
}

export async function listRecentCallLogs(limit = 50) {
  return prisma.salesScriptCallLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      contact: { select: { id: true, name: true, type: true } },
      performedBy: { select: { id: true, email: true } },
    },
  });
}

/** Optional AI improvement hook: surface winning categories by DEMO+CLOSED rate. */
export async function suggestWinningCategories(minSamples = 5): Promise<
  { category: SalesScriptCategory; demoOrClosedRate: number; n: number }[]
> {
  const stats = await getConversionStats(180);
  const out: { category: SalesScriptCategory; demoOrClosedRate: number; n: number }[] = [];

  for (const [category, v] of Object.entries(stats.byCategory)) {
    if (v.total < minSamples) continue;
    const good = (v.byOutcome.DEMO ?? 0) + (v.byOutcome.CLOSED ?? 0) + (v.byOutcome.INTERESTED ?? 0) * 0.25;
    const rate = good / v.total;
    out.push({ category: category as SalesScriptCategory, demoOrClosedRate: rate, n: v.total });
  }

  return out.sort((a, b) => b.demoOrClosedRate - a.demoOrClosedRate);
}

export function buildTrackingContextForLog(
  ctx: ScriptContext,
  category: SalesScriptCategory,
): { variantKey: string } {
  return { variantKey: getVariantMetadata(ctx) };
}
