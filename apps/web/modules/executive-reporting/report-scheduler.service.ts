import { prisma } from "@/lib/db";
import { formatUtcIsoWeekKey, formatUtcMonthKey, parsePeriodKey } from "./period-key";
import { logExecutiveScheduleTriggered } from "./executive-report.logging";
import { generateExecutiveReport } from "./report-generator.service";
import { sendExecutiveReport } from "./email-delivery.service";

function parseRecipients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.includes("@"));
}

function periodKeyForSchedule(freq: string, now: Date): string {
  return freq === "MONTHLY" ? formatUtcMonthKey(now) : formatUtcIsoWeekKey(now);
}

/**
 * Should we skip because we already ran in this period?
 */
/** Exported for unit tests — same rules as production scheduler. */
export function shouldSkipExecutiveScheduleRun(freq: string, lastRunAt: Date | null, now: Date): boolean {
  if (!lastRunAt) return false;
  const key = periodKeyForSchedule(freq, now);
  const parsed = parsePeriodKey(key);
  if (!parsed) return false;
  return lastRunAt >= parsed.startUtc && lastRunAt < parsed.endUtcExclusive;
}

export type RunScheduledReportsResult = {
  processed: number;
  generated: number;
  emailed: number;
  errors: string[];
};

/**
 * Active schedules → generate current period report → email recipients. Does not throw.
 */
export async function runScheduledReports(now = new Date()): Promise<RunScheduledReportsResult> {
  const errors: string[] = [];
  let generated = 0;
  let emailed = 0;

  try {
    const schedules = await prisma.executiveReportSchedule.findMany({
      where: { isActive: true },
    });

    for (const s of schedules) {
      try {
        if (shouldSkipExecutiveScheduleRun(s.frequency, s.lastRunAt, now)) {
          continue;
        }

        const periodKey = periodKeyForSchedule(s.frequency, now);
        logExecutiveScheduleTriggered({ scheduleId: s.id, periodKey, frequency: s.frequency });

        const gen = await generateExecutiveReport(periodKey);
        if (!gen.ok || !gen.reportId) {
          errors.push(`${s.id}: ${gen.ok ? "no_report_id" : gen.error}`);
          continue;
        }
        generated += 1;

        const recipients = parseRecipients(s.recipientsJson);
        if (recipients.length === 0) {
          errors.push(`${s.id}: no_recipients_configured`);
          continue;
        }

        const sent = await sendExecutiveReport(gen.reportId, recipients);
        if (!sent.ok) {
          errors.push(`${s.id}: send:${sent.error}`);
          continue;
        }
        emailed += sent.recipients;

        await prisma.executiveReportSchedule.update({
          where: { id: s.id },
          data: { lastRunAt: now },
        });
      } catch (e) {
        errors.push(`${s.id}: ${e instanceof Error ? e.message : "schedule_item_failed"}`);
      }
    }

    return { processed: schedules.length, generated, emailed, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "scheduler_failed");
    return { processed: 0, generated, emailed, errors };
  }
}
