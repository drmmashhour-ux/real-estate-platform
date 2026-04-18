/**
 * Deterministic behavior narratives per persona — combined with detectors, not fake pass/fail.
 */
import { simulatePaymentHesitation, withHesitation } from "@/modules/simulation/hesitation-simulator.service";
import type {
  ConversionStatus,
  PersonaJourneyResult,
  SimulationPersona,
  SimulationStep,
} from "@/modules/simulation/user-simulation.types";

function logLine(persona: SimulationPersona, msg: string): string {
  return `[${persona}] ${new Date().toISOString()} ${msg}`;
}

function baseStep(
  id: string,
  action: string,
  opts: Partial<SimulationStep> = {},
): Omit<SimulationStep, "at"> {
  return { id, action, ...opts };
}

/** A — Curious guest: browse, compare, leave. */
export function scenarioCuriousGuest(): PersonaJourneyResult {
  const persona: SimulationPersona = "curious_guest";
  const journey = "homepage_browse_compare_exit";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("g1", "Land on marketing homepage", { surface: "/", mood: "curious" }) }, persona),
    withHesitation({ ...baseStep("g2", "Open BNHub stays from nav", { surface: "/bnhub/stays", mood: "curious" }) }, persona),
    withHesitation({ ...baseStep("g3", "Scroll map/list — scanning prices", { mood: "neutral" }) }, persona),
    withHesitation({ ...baseStep("g4", "Open listing A — check photos", { surface: "listing", meta: { listing: "A" } }) }, persona),
    withHesitation({ ...baseStep("g5", "Back — open listing B", { surface: "listing", meta: { listing: "B" } }) }, persona),
    withHesitation({ ...baseStep("g6", "Compare nightly vs total — mentally note fees", { mood: "skeptical" }) }, persona),
    {
      ...withHesitation({ ...baseStep("g7", "Close tab without booking", { mood: "distracted" }) }, persona),
      abandonedHere: true,
    },
  ];
  const conversionStatus: ConversionStatus = "abandoned";
  const logs = [
    logLine(persona, "Session: no booking intent confirmed — exploratory behavior only."),
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus,
    recommendations: [],
    logs,
  };
}

/** B — Ready to book until payment hesitation. */
export function scenarioReadyToBook(): PersonaJourneyResult {
  const persona: SimulationPersona = "curious_guest";
  const journey = "search_to_checkout_hesitate";
  const payHes = simulatePaymentHesitation("price_sensitive_guest");
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("r1", "Search Montreal + dates", { surface: "/bnhub/stays" }) }, persona),
    withHesitation({ ...baseStep("r2", "Select listing, open price breakdown", { surface: "listing" }) }, persona),
    withHesitation({ ...baseStep("r3", "Start booking flow", { surface: "booking" }) }, persona),
    {
      ...withHesitation(
        {
          ...baseStep("r4", "Stripe checkout — pauses before pay", {
            surface: "stripe_checkout",
            mood: "skeptical",
            hesitationMs: payHes,
          }),
        },
        persona,
      ),
      abandonedHere: true,
    },
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "abandoned",
    recommendations: [],
    logs: [logLine(persona, "Abandoned at payment — common trust/fee hesitation pattern.")],
  };
}

/** C — Price sensitive: compare many, drop expensive. */
export function scenarioPriceSensitiveGuest(): PersonaJourneyResult {
  const persona: SimulationPersona = "price_sensitive_guest";
  const journey = "compare_and_abandon_expensive";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("p1", "Sort by price ascending", { surface: "search" }) }, persona),
    withHesitation({ ...baseStep("p2", "Open cheapest listing", { meta: { tier: "low" } }) }, persona),
    withHesitation({ ...baseStep("p3", "Open mid-tier listing for comparison", { meta: { tier: "mid" } }) }, persona),
    withHesitation(
      { ...baseStep("p4", "Skip premium listing after seeing total", { mood: "impatient", meta: { skip: "premium" } }) },
      persona,
    ),
    { ...withHesitation({ ...baseStep("p5", "Leave to compare on another site", { mood: "distracted" }) }, persona), abandonedHere: true },
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "abandoned",
    recommendations: [],
    logs: [logLine(persona, "Explicit price comparison — watch total stay vs nightly headline.")],
  };
}

/** New host — confusion and abandon before publish. */
export function scenarioFirstTimeHost(): PersonaJourneyResult {
  const persona: SimulationPersona = "first_time_host";
  const journey = "listing_draft_abandon";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("h1", "Start 'list your place'", { surface: "host_onboarding" }) }, persona),
    withHesitation({ ...baseStep("h2", "Stuck on cadastre / legal field", { mood: "confused", mistake: true }) }, persona),
    withHesitation({ ...baseStep("h3", "Retry with guess — validation error", { mood: "confused", mistake: true }) }, persona),
    withHesitation({ ...baseStep("h4", "Hesitate on nightly price", { surface: "pricing", mood: "skeptical" }) }, persona),
    {
      ...withHesitation(
        { ...baseStep("h5", "Exit before submit — listing not published", { surface: "publish", mood: "confused" }) },
        persona,
      ),
      abandonedHere: true,
    },
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "partial",
    recommendations: [],
    logs: [logLine(persona, "Draft saved — publish funnel not completed.")],
  };
}

export function scenarioExperiencedHost(): PersonaJourneyResult {
  const persona: SimulationPersona = "experienced_host";
  const journey = "dashboard_revenue_check";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("eh1", "Open host dashboard", { surface: "/bnhub/host/dashboard" }) }, persona),
    withHesitation({ ...baseStep("eh2", "Scan earnings widget", { mood: "neutral" }) }, persona),
    withHesitation({ ...baseStep("eh3", "Open pricing insights if visible", { mood: "neutral" }) }, persona),
    withHesitation({ ...baseStep("eh4", "No change — end session", { mood: "neutral" }) }, persona),
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "unknown",
    recommendations: [],
    logs: [logLine(persona, "Session ends without listing edit — value perception depends on insight quality.")],
  };
}

export function scenarioNewBroker(): PersonaJourneyResult {
  const persona: SimulationPersona = "new_broker";
  const journey = "lead_to_deal_uncertainty";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("b1", "New lead notification — open CRM", { surface: "crm" }) }, persona),
    withHesitation({ ...baseStep("b2", "Create deal — unsure which template", { mood: "confused", mistake: true }) }, persona),
    withHesitation({ ...baseStep("b3", "Open contract assist — read long form", { mood: "confused" }) }, persona),
    withHesitation({ ...baseStep("b4", "Stop — ask colleague later", { mood: "distracted" }) }, persona),
    { ...withHesitation({ ...baseStep("b5", "Leave deal in early stage", { surface: "deal" }) }, persona), abandonedHere: true },
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "partial",
    recommendations: [],
    logs: [logLine(persona, "Workflow clarity risk when templates multiply.")],
  };
}

export function scenarioBusyBrokerMobile(): PersonaJourneyResult {
  const persona: SimulationPersona = "busy_broker_mobile";
  const journey = "mobile_actions_quick";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("m1", "Open broker home / action feed", { surface: "mobile_broker", mood: "rushed" }) }, persona),
    withHesitation({ ...baseStep("m2", "Approve safe action without opening detail", { mood: "rushed" }) }, persona),
    withHesitation({ ...baseStep("m3", "Dismiss secondary tasks", { mood: "impatient" }) }, persona),
    withHesitation({ ...baseStep("m4", "Session end — satisfied", { mood: "neutral" }) }, persona),
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "converted",
    recommendations: [],
    logs: [logLine(persona, "Fast path — risk of skipping context; track mis-tap rate in prod analytics.")],
  };
}

export function scenarioAdminReviewer(): PersonaJourneyResult {
  const persona: SimulationPersona = "admin_reviewer";
  const journey = "moderation_sweep";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("a1", "Open admin moderation queue", { surface: "/admin" }) }, persona),
    withHesitation({ ...baseStep("a2", "Filter pending listings", { mood: "neutral" }) }, persona),
    withHesitation({ ...baseStep("a3", "Open fraud panel in parallel tab", { mood: "neutral" }) }, persona),
    withHesitation({ ...baseStep("a4", "Approve one — flag one for review", { mood: "neutral" }) }, persona),
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "converted",
    recommendations: [],
    logs: [logLine(persona, "Throughput depends on queue clarity and batch actions.")],
  };
}

export function scenarioConfusedUser(): PersonaJourneyResult {
  const persona: SimulationPersona = "confused_user";
  const journey = "wrong_nav_and_retry";
  const steps: SimulationStep[] = [
    withHesitation({ ...baseStep("c1", "Land from ad — wrong locale path", { mistake: true, mood: "confused" }) }, persona),
    withHesitation({ ...baseStep("c2", "Use browser back — lose form state", { mistake: true, mood: "confused" }) }, persona),
    withHesitation({ ...baseStep("c3", "Submit incomplete form — validation errors", { mistake: true, mood: "confused" }) }, persona),
    { ...withHesitation({ ...baseStep("c4", "Abandon — 'too hard'", { mood: "impatient" }) }, persona), abandonedHere: true },
  ];
  return {
    persona,
    journey,
    steps,
    frictionPoints: [],
    dropOffPoints: [],
    confusionEvents: [],
    conversionStatus: "abandoned",
    recommendations: [],
    logs: [logLine(persona, "Error recovery and state preservation are critical.")],
  };
}

export const ALL_SCENARIO_FACTORIES = [
  scenarioCuriousGuest,
  scenarioReadyToBook,
  scenarioPriceSensitiveGuest,
  scenarioFirstTimeHost,
  scenarioExperiencedHost,
  scenarioNewBroker,
  scenarioBusyBrokerMobile,
  scenarioAdminReviewer,
  scenarioConfusedUser,
] as const;
