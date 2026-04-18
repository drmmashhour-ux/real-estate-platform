import type { DailyRoutine, DailyRoutineBlock } from "./daily-routine.types";

const DAY_BLOCKS: DailyRoutineBlock[] = [
  {
    time: "Morning (2–3h)",
    focus: "Broker outreach & pipeline",
    actions: [
      "Contact 20 brokers (calls, DMs, email — manual)",
      "Follow up previous brokers from your list",
      "Goal: 3–5 real conversations logged in CRM",
    ],
  },
  {
    time: "Midday (2–3h)",
    focus: "Acquisition & response",
    actions: [
      "Launch or monitor ads (human setup; use Ads Engine outputs as drafts only)",
      "Respond to new leads as fast as you can — no auto-send",
      "Goal: qualify leads (score, intent, next step)",
    ],
  },
  {
    time: "Evening (2–3h)",
    focus: "Match, follow-up, pipeline",
    actions: [
      "Match leads to brokers (Routing V2 + judgment)",
      "Push follow-ups (manual messages; use templates as copy-paste only)",
      "Track deals — stage updates in CRM",
    ],
  },
];

/**
 * Same discipline every day for 14 days — push toward ~$10K trajectory (human execution only).
 */
export function build14DayRoutine(): DailyRoutine[] {
  return Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    blocks: DAY_BLOCKS.map((b) => ({
      ...b,
      actions: [...b.actions],
    })),
  }));
}
