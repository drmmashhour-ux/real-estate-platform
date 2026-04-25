/**
 * Next-run hints for cron / UI. Uses rule rows when present.
 */
import { prisma } from "@/lib/db";

export async function listAutomationScheduleSummary() {
  const rows = await prisma.managerAiAutomationRule.findMany({
    orderBy: { key: "asc" },
    select: { key: true, name: true, enabled: true, frequency: true, lastRunAt: true, nextRunAt: true },
  });
  return rows;
}
