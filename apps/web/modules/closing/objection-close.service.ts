import type { HardObjectionKey } from "./closing.types";

/** Hard objections — agreement trap + time compression + control illusion + low-risk entry. */
export const HARD_OBJECTION_RESPONSES: Record<
  HardObjectionKey,
  { main: string; alt: string; avoid: string[] }
> = {
  not_interested: {
    main: "You’re right — if this isn’t a fit, we’ll park it. One question: was it timing or relevance?",
    alt: "Fair — most teams say that until they see one live handoff. Worth ninety seconds?",
    avoid: ["But our platform is different", "You’re missing out", "Just hear me out"],
  },
  no_time: {
    main: "Totally fair — I’ll respect the clock. Three minutes tomorrow or a one-pager tonight — which protects your time?",
    alt: "You’re right — busy wins. Pick a slot under five minutes or I send a timestamped Loom — your call.",
    avoid: ["This will only take an hour", "Real quick minute", "You owe yourself"],
  },
  already_have_solution: {
    main:
      "Makes sense — many brokers already run a stack. Quick compare: where does qualified intent leak today?",
    alt: "Fair — not here to rip and replace. Could this sit beside what works as an incremental channel?",
    avoid: ["Your vendor is terrible", "You need us instead", "Throw that away"],
  },
  send_email: {
    main:
      "Happy to — what subject line would you actually open? I’ll match it to one screenshot of live intent.",
    alt:
      "Will do — I’ll send three bullets + one proof link. Reply ‘call’ if you want voice — no chase from me.",
    avoid: ["I’ll spam you", "Fine whatever", "You’ll never read it anyway"],
  },
};

export function getHardObjectionResponse(key: HardObjectionKey) {
  return HARD_OBJECTION_RESPONSES[key];
}
