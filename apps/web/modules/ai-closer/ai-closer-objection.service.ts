import type { AiCloserObjectionKey } from "./ai-closer.types";

export type ObjectionPlaybook = {
  acknowledgment: string;
  reframe: string;
  nextStep: string;
  avoid: string[];
};

const PLAYBOOKS: Record<Exclude<AiCloserObjectionKey, "none">, ObjectionPlaybook> = {
  just_browsing: {
    acknowledgment: "Totally fair — many good listings are worth a quick scan.",
    reframe: "To save you time, the fastest filter is a short visit only if it still feels promising on paper.",
    nextStep: "Would you rule this one in or out after a 15‑minute walkthrough this week?",
    avoid: ["Hard closing", "Fake scarcity", "Long monologue"],
  },
  not_ready: {
    acknowledgment: "Understood — timing matters.",
    reframe: "Often ‘not ready’ still benefits from seeing one strong option so your timeline has a benchmark.",
    nextStep: "If you wanted a low-pressure next step, would later this week or next week be easier?",
    avoid: ["Pressure deadlines", "Discount theatrics"],
  },
  too_expensive: {
    acknowledgment: "Price has to land right — thanks for saying it directly.",
    reframe: "Sometimes the monthly payment or closing costs shift the picture; sometimes it’s simply not the fit.",
    nextStep: "Do you want alternatives in a lower band, or should we sanity-check tradeoffs on this one first?",
    avoid: ["Promising undisclosed discounts", "Legal tax advice"],
  },
  need_to_think: {
    acknowledgment: "Of course.",
    reframe: "Usually the best next step is seeing it in person so you know if it’s worth thinking further.",
    nextStep: "Would you prefer later this week or next week for a quick visit?",
    avoid: ["Arguing with their pause", "Multiple asks in one breath"],
  },
  send_details_first: {
    acknowledgment: "Happy to — details help you compare apples to apples.",
    reframe: "I’ll pair that with two concrete time options so you’re not stuck in email limbo.",
    nextStep: "Are mornings or evenings easier if you decide to visit?",
    avoid: ["Wall of text", "Promising unavailable documents"],
  },
  no_time: {
    acknowledgment: "Appreciate you flagging bandwidth.",
    reframe: "We can keep this to a tight window — many visits are under 30 minutes.",
    nextStep: "Would a lunch-hour slot or evening slot work better next week?",
    avoid: ["Guilt trips", "Long questionnaires"],
  },
  already_working_with_someone: {
    acknowledgment: "Thanks for sharing — we respect existing relationships.",
    reframe: "If your broker agrees, optional platform logistics can still help schedule — never replaces their advice.",
    nextStep: "Would you like me to note your preference so we route without stepping on anyone’s toes?",
    avoid: ["Broker disparagement", "Bypassing consent"],
  },
  human_requested: {
    acknowledgment: "I’m the LECIPM assistant — I’ll connect human support.",
    reframe: "A broker can answer licensed questions and finalize showing requests.",
    nextStep: "I’ll escalate this thread so the right person follows up promptly.",
    avoid: ["Claiming broker credentials", "Blocking human handoff"],
  },
  complex_transactional: {
    acknowledgment: "That crosses into specifics a licensed pro should weigh in on.",
    reframe: "I can keep logistics moving while a broker handles compliance and paperwork.",
    nextStep: "Should we escalate to your listing broker or sales admin next?",
    avoid: ["Legal conclusions", "Tax outcomes"],
  },
};

export function detectObjection(text: string): AiCloserObjectionKey {
  const t = text.toLowerCase();
  if (/\b(real person|human|broker|talk to someone|speak to)\b/i.test(text)) return "human_requested";
  if (/\b(legal|lawyer|notary|zoning|tax implication|contrat)\b/i.test(text)) return "complex_transactional";
  if (/\b(just (browsing|looking)|only looking|Je regarde)\b/i.test(text)) return "just_browsing";
  if (/\b(not ready|too soon|later year|maybe next)\b/i.test(text)) return "not_ready";
  if (/\b(expensive|too much|over budget|can('t| not) afford|trop cher)\b/i.test(text)) return "too_expensive";
  if (/\b(need to think|think about|let me think|réfléchir)\b/i.test(text)) return "need_to_think";
  if (/\b(send (me )?detail|email me|PDF| brochure|documents first)\b/i.test(text)) return "send_details_first";
  if (/\b(no time|busy|swamped)\b/i.test(text)) return "no_time";
  if (/\balready (have |working with)|agent i use|my broker\b/i.test(text)) return "already_working_with_someone";
  return "none";
}

export function getObjectionPlaybook(key: AiCloserObjectionKey): ObjectionPlaybook | null {
  if (key === "none") return null;
  return PLAYBOOKS[key];
}
