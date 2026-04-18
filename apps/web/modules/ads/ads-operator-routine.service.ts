/**
 * Weekly operator rhythm — checklist only; no cron execution of spend.
 */

export type WeeklyOperatorDay = "monday" | "wednesday" | "friday";

export type WeeklyOperatorChecklist = Record<
  WeeklyOperatorDay,
  { title: string; tasks: { id: string; label: string; detail: string }[] }[]
>;

export const WEEKLY_OPERATOR_ROUTINE: WeeklyOperatorChecklist = {
  monday: [
    {
      title: "Monday — review & approve",
      tasks: [
        {
          id: "m1",
          label: "Review automation loop winners",
          detail: "Open Growth → Automation Loop; confirm UTM winners match Ads Manager.",
        },
        {
          id: "m2",
          label: "Approve new creative variants",
          detail: "Copy headline/primary text variants into Meta/Google as drafts — do not auto-publish.",
        },
      ],
    },
  ],
  wednesday: [
    {
      title: "Wednesday — health check",
      tasks: [
        {
          id: "w1",
          label: "Check CTR / CPL",
          detail: "Compare to prior 7d; if CPL spikes, pause losers in network UI (not via LECIPM).",
        },
        {
          id: "w2",
          label: "Pause low performers",
          detail: "Use weak campaign list + your own minimum volume rules before pausing.",
        },
      ],
    },
  ],
  friday: [
    {
      title: "Friday — scale & landing",
      tasks: [
        {
          id: "f1",
          label: "Scale winners",
          detail: "Duplicate winning ad sets; increase budget gradually — manual only.",
        },
        {
          id: "f2",
          label: "Review landing performance",
          detail: "Resolve landing feedback items (CTA, form, trust) in CMS or design backlog.",
        },
      ],
    },
  ],
};

export function buildWeeklyOperatorChecklist(): WeeklyOperatorChecklist {
  return WEEKLY_OPERATOR_ROUTINE;
}
