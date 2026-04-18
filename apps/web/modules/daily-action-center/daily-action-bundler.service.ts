import type { DailyAction, DailyActionFeed } from "./daily-action-center.types";
import { sortActionsByUrgencyThenDue } from "./daily-action-priority.service";

export function bundleDailyActions(actions: DailyAction[]): DailyActionFeed {
  const sorted = sortActionsByUrgencyThenDue(actions);
  return {
    kind: "daily_action_feed_v1",
    generatedAt: new Date().toISOString(),
    mustDoNow: sorted.filter((a) => a.urgency === "must_do_now"),
    doToday: sorted.filter((a) => a.urgency === "do_today"),
    doThisWeek: sorted.filter((a) => a.urgency === "do_this_week"),
    all: sorted,
    disclaimers: [
      "Actions are derived from your residential pipeline in LECIPM — review sensitive steps on desktop when required.",
      "No outbound legal notice or negotiation message is sent from the action list without your explicit approval in the relevant workflow.",
    ],
  };
}
