import type { ClosingPlaybook } from "./closing-playbook.types";

/**
 * Human-executed 48h sprint. No automated outreach.
 */
export function build48hClosingPlaybook(): ClosingPlaybook {
  return {
    id: "closing-playbook-48h-v1",
    steps: [
      {
        step: 1,
        title: "Hour 0–6",
        actions: ["Contact 20 brokers", "Confirm 3–5 active"],
      },
      {
        step: 2,
        title: "Hour 6–12",
        actions: ["Launch ads", "Prepare landing page"],
      },
      {
        step: 3,
        title: "Hour 12–24",
        actions: ["Respond instantly to leads", "Route to brokers"],
      },
      {
        step: 4,
        title: "Hour 24–36",
        actions: ["Push broker follow-ups", "Schedule visits"],
      },
      {
        step: 5,
        title: "Hour 36–48",
        actions: ["Push offer discussions", "Track serious buyers"],
      },
    ],
  };
}
