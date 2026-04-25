import { BROKER_DEMO_DEALS, BROKER_DEMO_TOP_DEAL, getDemoPipelineSnapshot } from "./demo-sample-data";

export type DemoStepFocus =
  | "hook"
  | "deal_list"
  | "insight"
  | "next_action"
  | "pipeline"
  | "close";

export type DemoFlowStep = {
  id: string;
  order: number;
  title: string;
  /** Budget time for this beat (aim: full flow ≤ ~3 min). */
  durationSec: number;
  /** What to say on the call — short, outcome-first. */
  script: string;
  /** Drives which panel is emphasized in the UI. */
  focus: DemoStepFocus;
  /** Shown in the product panel (not the full script). */
  uiCaption?: string;
};

export type DemoFlow = {
  steps: DemoFlowStep[];
  totalDurationSec: number;
  /** e.g. for header display */
  headline: string;
  deals: typeof BROKER_DEMO_DEALS;
  pipeline: ReturnType<typeof getDemoPipelineSnapshot>;
};

const STEPS: DemoFlowStep[] = [
  {
    id: "HOOK",
    order: 0,
    title: "Hook",
    durationSec: 20,
    focus: "hook",
    script:
      "Let me show you something quick — this tells you exactly which deal to focus on.",
    uiCaption: "You always know what to open first — no more guessing.",
  },
  {
    id: "DEAL_PRIORITY",
    order: 1,
    title: "Deal priority",
    durationSec: 35,
    focus: "deal_list",
    script: "This is your highest chance to close right now.",
    uiCaption: "Your list, with the one that matters at the top.",
  },
  {
    id: "AI_INSIGHT",
    order: 2,
    title: "Insight",
    durationSec: 35,
    focus: "insight",
    script: `This deal is likely to close because of ${BROKER_DEMO_TOP_DEAL.insightBecause}.`,
    uiCaption: "You see the score, the risk, and how engaged they are — in one glance.",
  },
  {
    id: "NEXT_ACTION",
    order: 3,
    title: "Next action",
    durationSec: 35,
    focus: "next_action",
    script: "It even tells you what to do next — and gives you a short message to start from.",
    uiCaption: "One suggested move plus a message you can send as-is or tweak.",
  },
  {
    id: "PIPELINE",
    order: 4,
    title: "Pipeline",
    durationSec: 25,
    focus: "pipeline",
    script: "You can line everything up in one place so nothing slips.",
    uiCaption: "Same deals, one pipeline — easy to scan in seconds.",
  },
  {
    id: "CLOSE",
    order: 5,
    title: "Close",
    durationSec: 25,
    focus: "close",
    script: "Want me to activate your account so you can try this with your real leads?",
    uiCaption: "Ready when you are — we turn it on, you use your own pipeline.",
  },
];

/**
 * Timed 3-minute-style demo: ~175s of content beats, outcome-only copy, no jargon.
 * UI consumers should use `focus` to highlight the right module.
 */
export function getDemoFlow(): DemoFlow {
  const totalDurationSec = STEPS.reduce((s, t) => s + t.durationSec, 0);
  return {
    steps: STEPS,
    totalDurationSec,
    headline: "3-minute broker demo",
    deals: BROKER_DEMO_DEALS,
    pipeline: getDemoPipelineSnapshot(),
  };
}
