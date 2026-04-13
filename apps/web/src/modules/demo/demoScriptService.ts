import type { DemoStepKey } from "./demoConfig";
import { DEMO_STEP_ORDER } from "./demoConfig";

type ScriptBundle = {
  title: string;
  script: string;
  talkingPoints: string[];
};

const SCRIPTS: Record<DemoStepKey, ScriptBundle> = {
  search: {
    title: "Discovery",
    script:
      "A user starts here and finds a property — same search experience for BNHUB stays and sale listings, without jumping to another product.",
    talkingPoints: [
      "Unified discovery: rentals + real estate in one platform.",
      "Filters are real patterns we use in production.",
      "Each card routes into the correct transaction type.",
    ],
  },
  property: {
    title: "Property depth",
    script:
      "This is where browsing turns into intent: price, trust signals, and clear actions — contact, platform broker, or book.",
    talkingPoints: [
      "Hero + facts mirror what guests and buyers need to decide.",
      "CTAs show three monetization paths: lead, assisted broker, booking.",
      "No dead ends — every path feeds CRM or checkout.",
    ],
  },
  contact: {
    title: "Action — inquiry",
    script:
      "This is where the platform moves from browsing to action: the inquiry is captured, scored, and routed — not lost in email.",
    talkingPoints: [
      "Before: browse-only. After: named lead in the pipeline.",
      "Broker / platform routing is explicit for the investor story.",
      "CRM row is the proof of system capture.",
    ],
  },
  booking: {
    title: "BNHUB — booking",
    script:
      "Short-term flow is structured: dates, price breakdown, and a clear path to payment — commission-ready when checkout completes.",
    talkingPoints: [
      "Investor-safe: preview path — no card required on this screen.",
      "Shows how take-rate maps to nights + fees.",
      "Booking record = traceable transaction in the ledger.",
    ],
  },
  ops: {
    title: "CRM / AI / close",
    script:
      "Behind the scenes, CRM and AI keep the process moving — priority leads, next actions, and close queue items.",
    talkingPoints: [
      "Simplified ops view — depth without admin clutter.",
      "AI suggestion = automation wedge, not a black box.",
      "This is how we scale from inquiries to transactions.",
    ],
  },
  revenue: {
    title: "Monetization & traction",
    script:
      "This is how monetization happens — bookings, inquiries, broker leads, and premium placement — with a traction snapshot you can qualify.",
    talkingPoints: [
      "Separate marketplace activity from conversion story.",
      "Label demo vs live when numbers are illustrative.",
      "Tie back to the three engines: BNHUB, brokerage, listings.",
    ],
  },
};

export function getDemoStepScript(stepKey: DemoStepKey): string {
  return SCRIPTS[stepKey]?.script ?? "";
}

export function getShortTalkingPoints(stepKey: DemoStepKey): string[] {
  return SCRIPTS[stepKey]?.talkingPoints ?? [];
}

export function getDemoStepTitle(stepKey: DemoStepKey): string {
  return SCRIPTS[stepKey]?.title ?? stepKey;
}

export function getNextStep(stepKey: DemoStepKey): DemoStepKey | null {
  const i = DEMO_STEP_ORDER.indexOf(stepKey);
  if (i < 0 || i >= DEMO_STEP_ORDER.length - 1) return null;
  return DEMO_STEP_ORDER[i + 1]!;
}

export function getPrevStep(stepKey: DemoStepKey): DemoStepKey | null {
  const i = DEMO_STEP_ORDER.indexOf(stepKey);
  if (i <= 0) return null;
  return DEMO_STEP_ORDER[i - 1]!;
}
