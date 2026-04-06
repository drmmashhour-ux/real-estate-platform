import type { ExecutionDay } from "@prisma/client";
import { DAILY_TARGETS } from "./constants";

export type DayTargetComparison = {
  messages: { actual: number; target: number; met: boolean; gap: number };
  brokers: { actual: number; target: number; met: boolean; gap: number };
  bookings: { actual: number; target: number; met: boolean; gap: number };
  missedLabels: string[];
};

export function compareDayToTargets(day: ExecutionDay | null): DayTargetComparison {
  const messagesSent = day?.messagesSent ?? 0;
  const brokersContacted = day?.brokersContacted ?? 0;
  const bookingsCompleted = day?.bookingsCompleted ?? 0;

  const messages = {
    actual: messagesSent,
    target: DAILY_TARGETS.messages,
    met: messagesSent >= DAILY_TARGETS.messages,
    gap: Math.max(0, DAILY_TARGETS.messages - messagesSent),
  };
  const brokers = {
    actual: brokersContacted,
    target: DAILY_TARGETS.brokers,
    met: brokersContacted >= DAILY_TARGETS.brokers,
    gap: Math.max(0, DAILY_TARGETS.brokers - brokersContacted),
  };
  const bookings = {
    actual: bookingsCompleted,
    target: DAILY_TARGETS.bookings,
    met: bookingsCompleted >= DAILY_TARGETS.bookings,
    gap: Math.max(0, DAILY_TARGETS.bookings - bookingsCompleted),
  };

  const missedLabels: string[] = [];
  if (!messages.met) missedLabels.push(`Messages: ${messages.actual}/${messages.target}`);
  if (!brokers.met) missedLabels.push(`Brokers: ${brokers.actual}/${brokers.target}`);
  if (!bookings.met) missedLabels.push(`Bookings: ${bookings.actual}/${bookings.target}`);

  return { messages, brokers, bookings, missedLabels };
}

/** Sum targets × days for a week window (7 days). */
export function weeklyTargetsExpected(days = 7) {
  return {
    messages: DAILY_TARGETS.messages * days,
    brokers: DAILY_TARGETS.brokers * days,
    bookings: DAILY_TARGETS.bookings * days,
  };
}

/**
 * Compare rolling-window actuals (sum of logged days) to a full calendar period quota (default 7 days).
 */
export function compareWeekToTargets(
  days: { messagesSent: number; brokersContacted: number; bookingsCompleted: number }[],
  periodDays = 7
) {
  const exp = weeklyTargetsExpected(periodDays);
  const actual = {
    messages: days.reduce((s, d) => s + d.messagesSent, 0),
    brokers: days.reduce((s, d) => s + d.brokersContacted, 0),
    bookings: days.reduce((s, d) => s + d.bookingsCompleted, 0),
  };
  if (days.length === 0) {
    return {
      expected: exp,
      actual,
      missedLabels: ["No execution-day rows in the last 7 days — start logging to track the path to $100K."],
    };
  }
  const missedLabels: string[] = [];
  if (actual.messages < exp.messages) missedLabels.push(`Week messages: ${actual.messages} / ${exp.messages}`);
  if (actual.brokers < exp.brokers) missedLabels.push(`Week brokers: ${actual.brokers} / ${exp.brokers}`);
  if (actual.bookings < exp.bookings) missedLabels.push(`Week bookings: ${actual.bookings} / ${exp.bookings}`);
  return { expected: exp, actual, missedLabels };
}
