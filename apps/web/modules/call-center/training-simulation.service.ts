import type {
  PersonaProfile,
  SimulationPersonaId,
  SimulationStartResult,
  SimulationStepResult,
  SimulationTurnState,
  TrainingLevel,
} from "./call-center.types";

const PROFILES: Record<SimulationPersonaId, PersonaProfile> = {
  broker_busy: {
    id: "broker_busy",
    audience: "BROKER",
    title: "Busy broker (15s max)",
    traits: ["Time-boxed", "Email-first", "Skeptical of new tools"],
    difficulty: 2,
    scriptCategory: "follow_up_broker",
  },
  broker_skeptical: {
    id: "broker_skeptical",
    audience: "BROKER",
    title: "Skeptical broker",
    traits: ["Challenges claims", "Wants proof", "Asks “who else uses this?”"],
    difficulty: 3,
    scriptCategory: "cold_call_broker",
  },
  broker_aggressive: {
    id: "broker_aggressive",
    audience: "BROKER",
    title: "Aggressive negotiator",
    traits: ["Interrupts", "Tests confidence", "Pushes back on price"],
    difficulty: 4,
    scriptCategory: "closing_broker",
  },
  broker_high_performer: {
    id: "broker_high_performer",
    audience: "BROKER",
    title: "High-performer broker",
    traits: ["Knows their stack", "Compares vendors", "Values speed"],
    difficulty: 3,
    scriptCategory: "demo_booking_broker",
  },
  investor_curious: {
    id: "investor_curious",
    audience: "INVESTOR",
    title: "Curious investor",
    traits: ["Open-minded", "Asks product questions", "Wants runway clarity"],
    difficulty: 1,
    scriptCategory: "pitch_investor",
  },
  investor_skeptical: {
    id: "investor_skeptical",
    audience: "INVESTOR",
    title: "Skeptical investor",
    traits: ["Risk-focused", "Due diligence tone", "Slow yes"],
    difficulty: 3,
    scriptCategory: "cold_call_investor",
  },
  investor_dominant: {
    id: "investor_dominant",
    audience: "INVESTOR",
    title: "Dominant investor",
    traits: ["Sets agenda", "Interrupts", "Demands concise answers"],
    difficulty: 4,
    scriptCategory: "closing_investor",
  },
  investor_analytical: {
    id: "investor_analytical",
    audience: "INVESTOR",
    title: "Analytical investor",
    traits: ["Metrics-driven", "Spreadsheet mindset", "Objections on unit economics"],
    difficulty: 3,
    scriptCategory: "follow_up_investor",
  },
};

/** Scripted client lines per persona (finite turns). */
const SCRIPTS: Record<SimulationPersonaId, string[]> = {
  broker_busy: [
    "You’ve got sixty seconds — what do you want?",
    "I’m slammed. Email me something I can skim.",
    "If there’s no proof of inbound that isn’t fluff, we’re done.",
    "Fine — send one concrete example from my market.",
  ],
  broker_skeptical: [
    "Another “platform” — what’s different from my CRM inbox?",
    "Who in my market actually uses this today?",
    "Sounds like promises. Show me how a lead lands in my phone.",
    "Maybe. What’s the catch on setup and data sync?",
  ],
  broker_aggressive: [
    "You’re interrupting my day — make it worth it.",
    "What’s your price and what do I actually get?",
    "I don’t buy slide decks. Show live flow or stop calling.",
    "Convince me in one sentence why I shouldn’t hang up.",
  ],
  broker_high_performer: [
    "I already run a tight funnel — where’s the incremental deal flow?",
    "Integration matters. How fast can ops adopt this?",
    "Quality over volume — how do you filter tire-kickers?",
    "Book something short — but I’m not redoing my stack.",
  ],
  investor_curious: [
    "Tell me what LECIPM actually does for brokers in plain English.",
    "How do you monetize without killing broker margins?",
    "What’s traction today — cities, brokers, GMV?",
    "Interesting — what would you need from me next?",
  ],
  investor_skeptical: [
    "Marketplace plays are crowded — why now?",
    "Walk me through downside risks on adoption.",
    "What breaks if regulators tighten advertising rules?",
    "I’m not convinced yet — what proof do you have?",
  ],
  investor_dominant: [
    "You called me — bottom line first.",
    "Skip the story. Revenue model in two lines.",
    "I’ll ask once: why should I care this quarter?",
    "Give me the numbers or we’re finished.",
  ],
  investor_analytical: [
    "CAC payback assumptions — state them.",
    "Unit economics vs traditional portals?",
    "Show cohort retention if you have it.",
    "What KPI do you optimize weekly?",
  ],
};

const FLOW_BY_PERSONA: Record<SimulationPersonaId, string[]> = {
  broker_busy: ["Open with respect for time", "Offer proof or example", "Book or email — don’t ramble"],
  broker_skeptical: ["Differentiation + proof", "Peer usage", "Concrete workflow"],
  broker_aggressive: ["Stay calm", "One proof point", "Direct ask"],
  broker_high_performer: ["Incremental value", "Integration speed", "Quality filters"],
  investor_curious: ["Plain positioning", "Monetization clarity", "Traction facts"],
  investor_skeptical: ["Why now", "Risks", "Evidence"],
  investor_dominant: ["Lead with headline", "Numbers", "Confidence without hype"],
  investor_analytical: ["Metrics", "Economics", "Operating cadence"],
};

export function getPersonaProfile(id: SimulationPersonaId): PersonaProfile {
  return PROFILES[id];
}

export function listPersonasForLevel(level: TrainingLevel): SimulationPersonaId[] {
  const maxDiff =
    level === "beginner" ? 2 : level === "intermediate" ? 3 : level === "advanced" ? 4 : 4;
  return (Object.keys(PROFILES) as SimulationPersonaId[]).filter((id) => PROFILES[id].difficulty <= maxDiff);
}

export function isPersonaUnlocked(id: SimulationPersonaId, level: TrainingLevel): boolean {
  return listPersonasForLevel(level).includes(id);
}

function initialStage(id: SimulationPersonaId): SimulationStartResult["suggestedStage"] {
  if (id.includes("busy")) return "opening";
  if (id.includes("aggressive") || id.includes("dominant")) return "pitch";
  return "opening";
}

/**
 * Begin a simulator session — no outbound calls; text-only role-play.
 */
export function startSimulation(type: SimulationPersonaId): SimulationStartResult {
  const persona = PROFILES[type];
  const lines = SCRIPTS[type];
  const first = lines[0] ?? "Hello — what’s this about?";
  return {
    persona,
    firstClientMessage: first,
    flowOutline: FLOW_BY_PERSONA[type],
    suggestedStage: initialStage(type),
  };
}

function detectPositiveIntent(text: string): boolean {
  return /\b(demo|book|calendar|yes|works|send|interest|schedule|minutes)\b/i.test(text);
}

function detectHardNo(text: string): boolean {
  return /\b(not interested|don'?t call|stop|never|we'?re done|hang)\b/i.test(text);
}

/**
 * Advance one turn: append user reply, return next client line or end.
 * `turnIndex` tracks completed user turns (matches `userReplies.length` after the step).
 */
export function stepSimulation(state: SimulationTurnState, userReply: string): SimulationStepResult {
  const script = SCRIPTS[state.personaId];
  const trimmed = userReply.trim();
  const userReplies = [...state.userReplies, trimmed];

  if (!trimmed) {
    return {
      state: { ...state, userReplies },
      nextClientMessage: "",
      ended: state.ended,
    };
  }

  const n = userReplies.length;
  let ended = false;
  let outcome = state.outcome;
  let nextClientMessage = "";

  if (detectHardNo(trimmed)) {
    ended = true;
    outcome = "lost";
    nextClientMessage = "We’re done — take care.";
  } else if (detectPositiveIntent(trimmed)) {
    ended = true;
    outcome = "won";
    nextClientMessage = "Alright — send the invite. Let’s keep it short.";
  } else if (n >= script.length) {
    ended = true;
    outcome = outcome ?? "neutral";
    nextClientMessage = "Thanks — I need to run. Follow up over email.";
  } else {
    nextClientMessage = script[n] ?? "";
  }

  const clientMessages = [...state.clientMessages];
  if (nextClientMessage) clientMessages.push(nextClientMessage);

  const newState: SimulationTurnState = {
    personaId: state.personaId,
    turnIndex: n,
    clientMessages,
    userReplies,
    ended,
    outcome,
  };

  return { state: newState, nextClientMessage, ended };
}

export function createInitialTurnState(personaId: SimulationPersonaId, firstLine: string): SimulationTurnState {
  return {
    personaId,
    turnIndex: 0,
    clientMessages: [firstLine],
    userReplies: [],
    ended: false,
  };
}
