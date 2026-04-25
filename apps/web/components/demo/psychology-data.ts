export const BROKERS_CARE_ABOUT: string[] = [
  "Saving time",
  "Closing more deals",
  "Reducing errors",
  "Looking professional to clients",
];

export const BROKERS_FEAR: string[] = [
  "Legal risk",
  "Losing control",
  "Looking incompetent",
  "Wasting time on tools",
];

export const MAKES_THEM_SAY_YES: string[] = [
  "Seeing it live (demo)",
  "Real use case",
  "Immediate value",
  "Simplicity",
];

export type PositioningPair = { insteadOf: string; say: string };

export const POSITIONING_PAIRS: PositioningPair[] = [
  {
    insteadOf: "AI platform",
    say: "outil qui t’aide à aller plus vite et éviter des erreurs",
  },
  {
    insteadOf: "automation",
    say: "gain de temps sur les tâches répétitives",
  },
];

export const GREEN_FLAGS: string[] = [
  "asks questions",
  "mentions time issues",
  "wants to try",
];

export const RED_FLAGS: string[] = ["silent", "distracted", 'says "send me info"'];
