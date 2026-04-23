import type { ClientPersonalityType, PersonalityStrategy } from "./personality.types";

const STRATEGIES: Record<ClientPersonalityType, PersonalityStrategy> = {
  DRIVER: {
    title: "Driver close",
    bullets: ["Keep answers short", "Lead with outcomes and proof hooks", "Offer a fast, bounded next step"],
  },
  ANALYTICAL: {
    title: "Analytical persuasion",
    bullets: ["Lead with structure and definitions", "Share numbers, ranges, and assumptions", "Invite verification — screenshots, cohorts, methodology"],
  },
  EXPRESSIVE: {
    title: "Expressive engagement",
    bullets: ["Paint the upside and narrative arc", "Match enthusiasm without over-claiming", "Tie vision to one concrete milestone"],
  },
  AMIABLE: {
    title: "Amiable trust path",
    bullets: ["Prioritize reassurance and empathy", "Reduce pressure; emphasize partnership", "Offer choice and opt-out clarity"],
  },
};

export function getPersonalityStrategy(personality: ClientPersonalityType): PersonalityStrategy {
  return STRATEGIES[personality];
}
