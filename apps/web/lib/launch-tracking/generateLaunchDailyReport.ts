import type { LaunchDailyRow } from "@/lib/launch-tracking/metrics";

export type LaunchDailyReport = {
  worked: string[];
  didnt: string[];
  improve: string[];
};

function sumWindow(rows: LaunchDailyRow[], startIdx: number, len: number): LaunchDailyRow | null {
  if (startIdx < 0 || len <= 0 || startIdx + len > rows.length) return null;
  const acc: LaunchDailyRow = {
    date: "",
    messagesSent: 0,
    repliesReceived: 0,
    demosBooked: 0,
    demosCompleted: 0,
    usersCreated: 0,
    activatedUsers: 0,
    payingUsers: 0,
    postsCreated: 0,
    contentViews: 0,
    contentClicks: 0,
    contentConversions: 0,
  };
  for (let i = startIdx; i < startIdx + len; i++) {
    const r = rows[i]!;
    acc.messagesSent += r.messagesSent;
    acc.repliesReceived += r.repliesReceived;
    acc.demosBooked += r.demosBooked;
    acc.demosCompleted += r.demosCompleted;
    acc.usersCreated += r.usersCreated;
    acc.activatedUsers += r.activatedUsers;
    acc.payingUsers += r.payingUsers;
    acc.postsCreated += r.postsCreated;
    acc.contentViews += r.contentViews;
    acc.contentClicks += r.contentClicks;
    acc.contentConversions += r.contentConversions;
  }
  return acc;
}

function pctRatio(num: number, den: number): number {
  if (den <= 0) return 0;
  return (num / den) * 100;
}

/**
 * Compares the last 7 days vs the previous 7 days (when enough data). Plain-language launch insights.
 */
export function generateLaunchDailyReport(sortedSeriesAsc: LaunchDailyRow[]): LaunchDailyReport {
  const rows = sortedSeriesAsc;
  const worked: string[] = [];
  const didnt: string[] = [];
  const improve: string[] = [];

  if (rows.length === 0) {
    improve.push("Start logging outreach and content numbers (Add to today) so this report can compare weeks.");
    return { worked, didnt, improve };
  }

  const last = rows[rows.length - 1]!;
  const last7 = sumWindow(rows, Math.max(0, rows.length - 7), 7);
  const prev7 = sumWindow(rows, Math.max(0, rows.length - 14), 7);

  if (last7 && prev7 && rows.length >= 8) {
    if (last7.repliesReceived > prev7.repliesReceived && last7.messagesSent >= prev7.messagesSent * 0.7) {
      worked.push("Reply volume is up versus the prior week while outreach stayed steady — messaging is landing.");
    }
    if (last7.demosCompleted > prev7.demosCompleted) {
      worked.push("More demos completed this week than last — keep the same booking → follow-up rhythm.");
    }
    if (last7.contentConversions > prev7.contentConversions && last7.contentClicks >= prev7.contentClicks) {
      worked.push("Content conversions improved week over week.");
    }
    if (last7.messagesSent > prev7.messagesSent * 1.2 && last7.repliesReceived < prev7.repliesReceived) {
      didnt.push("More messages sent but fewer replies — subject lines, targeting, or timing may be off.");
    }
    if (last7.demosBooked > prev7.demosBooked && last7.demosCompleted < prev7.demosCompleted) {
      didnt.push("Demos booked rose but completions dropped — confirm calendar reminders and agenda.");
    }
    const actLast = pctRatio(last7.activatedUsers, last7.usersCreated);
    const actPrev = pctRatio(prev7.activatedUsers, prev7.usersCreated);
    if (last7.usersCreated > 0 && actLast + 5 < actPrev) {
      didnt.push("Activation rate slipped vs last week — check onboarding friction and first-value prompts.");
    }
  }

  const replyRate = pctRatio(last.repliesReceived, last.messagesSent);
  if (last.messagesSent > 0 && replyRate < 8) {
    improve.push("Reply rate under ~8% today — try shorter messages, one clear CTA, or warmer segments.");
  }
  const demoRate = pctRatio(last.demosCompleted, last.demosBooked);
  if (last.demosBooked > 0 && demoRate < 50) {
    improve.push("Less than half of booked demos completed — send a same-day reminder and a one-line agenda.");
  }
  const ctr = pctRatio(last.contentClicks, last.contentViews);
  if (last.contentViews > 20 && ctr < 2) {
    improve.push("Content CTR is low — refresh hooks/thumbnails and test one new headline.");
  }
  const cvr = pctRatio(last.contentConversions, Math.max(1, last.contentClicks));
  if (last.contentClicks > 10 && cvr < 5) {
    improve.push("Clicks are not converting — align landing CTA with the post promise.");
  }
  if (last.usersCreated > 0 && last.payingUsers === 0 && last.activatedUsers > 3) {
    improve.push("Activated users but no payers in-window — run one focused upgrade touch (email or in-product).");
  }

  if (!worked.length && rows.length >= 3) {
    worked.push("Data is flowing — keep daily logging consistent for clearer week-over-week reads.");
  }
  if (!didnt.length && !improve.length && rows.length < 8) {
    improve.push("Log at least two full weeks to unlock stronger before/after comparisons.");
  }

  return { worked, didnt, improve };
}
