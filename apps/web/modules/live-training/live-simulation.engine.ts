import type {
  LivePersonaType,
  LiveSessionConfig,
  LiveSessionState,
  LiveStepResult,
  LiveChatTurn,
} from "./live-training.types";
import { evaluateLiveTurn } from "./live-feedback.engine";

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `live-${Date.now()}`;
}

const PERSONA_META: Record<
  LivePersonaType,
  { title: string; audience: "BROKER" | "INVESTOR"; opener: string }
> = {
  driver_broker: {
    title: "Driver broker",
    audience: "BROKER",
    opener: "Bottom line — what outcome do I get this week if I say yes?",
  },
  expressive_user: {
    title: "Expressive user",
    audience: "INVESTOR",
    opener: "Paint the vision — why should I feel excited about this versus everything else?",
  },
  amiable_client: {
    title: "Amiable client",
    audience: "BROKER",
    opener: "Hey — I appreciate you reaching out. Walk me through this gently — what are we actually solving?",
  },
  aggressive_broker: {
    title: "Aggressive broker",
    audience: "BROKER",
    opener: "You’ve got thirty seconds — why shouldn’t I hang up?",
  },
  skeptical_broker: {
    title: "Skeptical broker",
    audience: "BROKER",
    opener: "Let me guess — another dashboard that promises leads?",
  },
  dominant_investor: {
    title: "Dominant investor",
    audience: "INVESTOR",
    opener: "Start with the headline. Why does this deserve capital attention today?",
  },
  analytical_investor: {
    title: "Analytical investor",
    audience: "INVESTOR",
    opener: "Walk me through acquisition economics — assumptions on paper.",
  },
};

const INTERRUPTS: Record<LivePersonaType, string[]> = {
  driver_broker: [
    "Stop — headline only. What number moves?",
    "Too long — give me proof in one sentence.",
    "Interrupting — what’s the outcome today, not someday?",
  ],
  expressive_user: [
    "Hold on — where’s the excitement in that answer?",
    "Pause — story’s thin — give me a sharper picture.",
    "Too dry — connect it to upside I can feel.",
  ],
  amiable_client: [
    "Sorry to jump in — this still feels pushy for me.",
    "I’m uncomfortable — can we slow down?",
    "Hang on — I need reassurance before details.",
  ],
  aggressive_broker: [
    "Hold on — you’re rambling. Bottom line.",
    "Stop — what proof do you actually have?",
    "I’m losing patience — one concrete example or we’re done.",
  ],
  skeptical_broker: [
    "Pause — who in my market runs this live?",
    "Hang on — how is this not another listing portal?",
    "Slow down — what integrates into my CRM today?",
  ],
  dominant_investor: [
    "Interrupting — numbers first, story second.",
    "Cut it — what’s the milestone this quarter?",
    "Too vague — give me one KPI you obsess over.",
  ],
  analytical_investor: [
    "Wait — define your CAC payback in one line.",
    "Back up — what’s the margin on a typical deal?",
    "Clarify — which cohort are you measuring retention on?",
  ],
};

const REPLIES: Record<LivePersonaType, { low: string[]; mid: string[]; high: string[] }> = {
  driver_broker: {
    low: [
      "Sixty seconds — what do I walk away with?",
      "Skip features — what metric improves first?",
    ],
    mid: [
      "Still fluffy — give me one concrete workflow win.",
      "You’re circling — name one proof I can verify live.",
    ],
    high: [
      "Unless you show pipeline impact now, we’re wasting time.",
      "I’m not here for slides — show me motion.",
    ],
  },
  expressive_user: {
    low: [
      "I want to feel the upside — what changes for my team?",
      "Tell me the story of a deal that happened because of this.",
    ],
    mid: [
      "That sounds generic — where’s the transformation narrative?",
      "Give me one bold scenario — why is this better than status quo?",
    ],
    high: [
      "You’re selling vitamins — I need the hero outcome.",
      "Unless you inspire confidence, I’m staying put.",
    ],
  },
  amiable_client: {
    low: [
      "Thanks — what should I watch out for so I don’t get surprised?",
      "That helps — how do we keep this low-pressure on my side?",
    ],
    mid: [
      "I’m worried about adoption — how do others ease into this?",
      "Can we keep this collaborative — no hard selling?",
    ],
    high: [
      "This is starting to feel rushed — can we pause and reset?",
      "I need trust before next steps — meet me where I am.",
    ],
  },
  aggressive_broker: {
    low: [
      "You’re selling air. What’s the one thing I can verify in 2 minutes?",
      "I don’t do ‘platform’ poetry. What’s the offer on the table?",
    ],
    mid: [
      "That’s still marketing. Show me a real lead handoff path.",
      "If you can’t name a city with live roll-out, I’m out.",
    ],
    high: [
      "This is the same pitch I’ve heard from three vendors. Prove it or move on.",
      "I’m not buying ‘innovation’ — I buy pipeline. Show it.",
    ],
  },
  skeptical_broker: {
    low: [
      "What’s the catch on setup? I don’t have a week to babysit integration.",
      "How do you keep lead quality from going to trash over time?",
    ],
    mid: [
      "I already have three lead sources. Why add one more headache?",
      "If you can’t show me a live example, this is a no.",
    ],
    high: [
      "I’ve been burned on lead gen. You need to show me a live call or I’m done.",
      "You’re asking for my time without evidence. That’s a pass.",
    ],
  },
  dominant_investor: {
    low: [
      "I set the terms. You have 2 minutes for the investment case.",
      "Equity is expensive — what’s the comp to public market returns?",
    ],
    mid: [
      "This still sounds soft. Where’s defensibility?",
      "Tell me why this isn’t a commodity marketplace again.",
    ],
    high: [
      "You’re dancing. Give me downside scenarios I can diligence.",
      "Unless you’ve got traction I can smell, stop wasting both of us.",
    ],
  },
  analytical_investor: {
    low: [
      "Provide the metric stack: CAC, LTV, churn — approximate is fine.",
      "Which markets are subsidized versus profitable?",
    ],
    mid: [
      "Your answer is directional. I need specifics on unit economics.",
      "How sensitive is growth to brokerage adoption vs consumer demand?",
    ],
    high: [
      "Still hand-wavy — where’s the reconciliation to cash receipts?",
      "Unless you tie metrics to audited facts, we’re not progressing.",
    ],
  },
};

function tierForTension(t: number): keyof typeof REPLIES["aggressive_broker"] {
  if (t >= 70) return "high";
  if (t >= 40) return "mid";
  return "low";
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

export function personaOpening(personaType: LivePersonaType): string {
  return PERSONA_META[personaType].opener;
}

export function configForPersona(personaType: LivePersonaType, paceLevel: number): LiveSessionConfig {
  const seconds = Math.max(18, 52 - paceLevel * 8);
  const intensity = Math.min(0.55, 0.18 + paceLevel * 0.09);
  return {
    personaType,
    secondsPerTurn: seconds,
    interruptIntensity: intensity,
    maxTurns: 14,
  };
}

function detectWin(text: string): boolean {
  return /\b(book|invite|calendar|schedule|demo|works for me|let'?s do)\b/i.test(text);
}

function detectLoss(text: string): boolean {
  return /\b(not interested|never|stop calling|don't call|hang up)\b/i.test(text);
}

/**
 * Starts a paced live simulation — text-only persona; user stays in control of send timing.
 */
export function startLiveSession(personaType: LivePersonaType, paceLevel = 1): LiveSessionState {
  const opener = personaOpening(personaType);
  const cfg = configForPersona(personaType, paceLevel);
  const now = Date.now();
  return {
    sessionId: uid(),
    config: cfg,
    tension: 28,
    objectionStack: 0,
    turn: 0,
    messages: [{ role: "persona", text: opener, atMs: now }],
    ended: false,
    lastInterrupt: false,
  };
}

export function appendUserTurn(
  state: LiveSessionState,
  userText: string,
  timedOut: boolean,
): LiveStepResult {
  if (state.ended || !userText.trim()) {
    const fb = evaluateLiveTurn(userText.trim() || " ", state.config.personaType, state.tension);
    return { state, feedback: fb };
  }

  const feedback = evaluateLiveTurn(userText, state.config.personaType, state.tension);

  let tension = state.tension + (feedback.score < 58 ? 14 : feedback.score < 72 ? 6 : -5);
  tension = Math.min(95, Math.max(15, tension));

  let objectionStack = state.objectionStack;
  if (feedback.tags.includes("weak_close") || feedback.tags.includes("no_control")) objectionStack += 1;
  if (feedback.tags.includes("strong_close")) objectionStack = Math.max(0, objectionStack - 1);

  const turn = state.turn + 1;

  let outcome = state.outcome;
  let ended = false;

  if (detectWin(userText)) {
    ended = true;
    outcome = "won";
  } else if (detectLoss(userText)) {
    ended = true;
    outcome = "lost";
  } else if (turn >= state.config.maxTurns) {
    ended = true;
    outcome = "neutral";
  }

  let interruptLine: string | undefined;
  let nextPersona = "";

  if (!ended) {
    const roll = Math.random();
    const interruptChance =
      state.config.interruptIntensity +
      (timedOut ? 0.35 : 0) +
      objectionStack * 0.06 +
      (feedback.tags.includes("no_control") ? 0.15 : 0);

    if (roll < interruptChance) {
      interruptLine = pick(INTERRUPTS[state.config.personaType], turn + tension);
    }

    const tier = tierForTension(tension + objectionStack * 8);
    const pool = REPLIES[state.config.personaType][tier];
    nextPersona = pick(pool, tension + turn * 13);

    if (interruptLine) {
      nextPersona = `${interruptLine}\n\n${nextPersona}`;
    }
  }

  const userTurn: LiveChatTurn = { role: "user", text: userText.trim(), atMs: Date.now(), feedback };
  const messages: LiveChatTurn[] = [...state.messages, userTurn];

  if (ended && outcome === "won") {
    messages.push({
      role: "persona",
      text: "Fine — ten minutes. Send the invite while we’re on the phone.",
      atMs: Date.now(),
    });
  } else if (ended && outcome === "lost") {
    messages.push({
      role: "persona",
      text: "Not interested. Goodbye.",
      atMs: Date.now(),
    });
  } else if (ended && outcome === "neutral") {
    messages.push({
      role: "persona",
      text: "I’ve got to jump — circle back with something sharper.",
      atMs: Date.now(),
    });
  } else if (!ended) {
    messages.push({ role: "persona", text: nextPersona, atMs: Date.now() });
  }

  const newState: LiveSessionState = {
    ...state,
    tension,
    objectionStack,
    turn,
    messages,
    ended,
    outcome,
    lastInterrupt: Boolean(interruptLine),
  };

  return { state: newState, feedback, interruptLine };
}
