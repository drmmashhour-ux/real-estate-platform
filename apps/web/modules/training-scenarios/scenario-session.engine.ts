import { evaluateLiveTurn } from "@/modules/live-training/live-feedback.engine";
import {
  configForPersona,
} from "@/modules/live-training/live-simulation.engine";
import type {
  LiveSessionState,
  LiveStepResult,
  LiveChatTurn,
} from "@/modules/live-training/live-training.types";

import { getScenarioById } from "./training-scenario.service";
import type { TrainingScenario } from "./training-scenarios.types";

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sc-${Date.now()}`;
}

export function difficultyToPaceLevel(
  difficulty: TrainingScenario["difficulty"],
): number {
  switch (difficulty) {
    case "EASY":
      return 1;
    case "MEDIUM":
      return 2;
    case "HARD":
      return 3;
    case "EXTREME":
      return 4;
    default:
      return 2;
  }
}

function detectLoss(text: string): boolean {
  return /\b(not interested|never|stop calling|don't call|hang up)\b/i.test(text);
}

export function matchesScenarioSuccess(userText: string, scenario: TrainingScenario): boolean {
  const t = userText.trim();
  if (scenario.success_condition === "broker_demo_booked") {
    return /\b(book|invite|calendar|schedule|demo|works for me|let'?s do|ten minutes)\b/i.test(t);
  }
  return /\b(meeting|calendar|book|zoom|invite|schedule|catch up|call|minutes)\b/i.test(t);
}

function fallbackPersonaPushback(scenario: TrainingScenario): string {
  return scenario.type === "INVESTOR"
    ? "I’m still not convinced — what’s the one diligence artifact you’d send me tonight?"
    : "Still not seeing it — give me one concrete proof path.";
}

/**
 * Begin a structured scenario — opening line from data, persona voice from livePersona.
 */
export function startScenarioLiveSession(scenario: TrainingScenario): LiveSessionState {
  const pace = difficultyToPaceLevel(scenario.difficulty);
  const baseCfg = configForPersona(scenario.livePersona, pace);
  const cfg = {
    ...baseCfg,
    maxTurns: Math.max(baseCfg.maxTurns, scenario.objections.length + 10),
  };
  const now = Date.now();
  return {
    sessionId: uid(),
    config: cfg,
    tension: 26 + pace * 3,
    objectionStack: 0,
    turn: 0,
    messages: [{ role: "persona", text: scenario.opening_line, atMs: now }],
    ended: false,
    lastInterrupt: false,
    scenarioId: scenario.id,
    scenarioObjectionIndex: 0,
  };
}

/**
 * Same contract as appendUserTurn, but objections come from scenario script; weak replies jump ahead in the queue.
 */
export function appendScenarioUserTurn(
  state: LiveSessionState,
  userText: string,
  timedOut: boolean,
): LiveStepResult {
  const scenario = state.scenarioId ? getScenarioById(state.scenarioId) : undefined;
  if (!scenario) {
    throw new Error("appendScenarioUserTurn requires state.scenarioId");
  }

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

  if (matchesScenarioSuccess(userText, scenario)) {
    ended = true;
    outcome = "won";
  } else if (detectLoss(userText)) {
    ended = true;
    outcome = "lost";
  } else if (turn >= state.config.maxTurns) {
    ended = true;
    outcome = "neutral";
  }

  const objections = scenario.objections;
  const maxIdx = Math.max(0, objections.length - 1);
  const displayIdx =
    objections.length === 0 ? 0 : Math.min(state.scenarioObjectionIndex ?? 0, maxIdx);

  let nextPersona = "";
  let interruptLine: string | undefined;
  let nextCursor = state.scenarioObjectionIndex ?? 0;

  if (!ended) {
    if (objections.length === 0) {
      nextPersona = fallbackPersonaPushback(scenario);
    } else {
      nextPersona = objections[displayIdx]!;
    }

    const roll = Math.random();
    const weakEscalation = feedback.score < 58;
    if (objections.length > 0 && roll < (timedOut ? 0.22 : 0) + objectionStack * 0.05) {
      interruptLine = "Hang on — you’re losing me. Tighten that.";
    }

    if (objections.length > 0) {
      if (weakEscalation) nextCursor = Math.min(displayIdx + 2, maxIdx);
      else nextCursor = Math.min(displayIdx + 1, maxIdx);
    }

    if (interruptLine) {
      nextPersona = `${interruptLine}\n\n${nextPersona}`;
    }
  }

  const userTurn: LiveChatTurn = { role: "user", text: userText.trim(), atMs: Date.now(), feedback };
  const messages: LiveChatTurn[] = [...state.messages, userTurn];

  if (ended && outcome === "won") {
    messages.push({
      role: "persona",
      text:
        scenario.type === "INVESTOR"
          ? "Alright — put it on the calendar and send the agenda. I’ll give you twenty minutes."
          : "Fine — ten minutes. Send the invite while we’re on the phone.",
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
      text: "I’ve got to jump — come back with something sharper.",
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
    scenarioObjectionIndex: !ended && scenario.objections.length > 0 ? nextCursor : state.scenarioObjectionIndex,
  };

  return { state: newState, feedback, interruptLine };
}
