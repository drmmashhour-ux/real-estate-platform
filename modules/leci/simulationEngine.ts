export type ScenarioType = "broker_normal" | "broker_aggressive" | "confused_buyer" | "investor_grilling";

export interface SimulationMessage {
  id: string;
  role: "user";
  content: string;
  tone: string;
  pressure?: boolean;
}

export const SCENARIOS: Record<ScenarioType, SimulationMessage[]> = {
  broker_normal: [
    { id: "bn1", role: "user", content: "Pourquoi j’utiliserais ça ? J'ai déjà mes outils.", tone: "professional, slightly skeptical" },
    { id: "bn2", role: "user", content: "Est-ce que ça me fait vraiment gagner du temps sur mes offres ?", tone: "analytical" },
    { id: "bn3", role: "user", content: "Comment vous gérez les formulaires OACIQ ?", tone: "curious" }
  ],
  broker_aggressive: [
    { id: "ba1", role: "user", content: "Ça sert à rien ton affaire, on fait ça bien depuis des années.", tone: "impatient, challenging" },
    { id: "ba2", role: "user", content: "C’est pas légal ton truc, tu vas mêler tout le monde.", tone: "aggressive", pressure: true },
    { id: "ba3", role: "user", content: "Je veux une réponse claire: oui ou non, c'est valide ou pas ?", tone: "demanding", pressure: true }
  ],
  confused_buyer: [
    { id: "cb1", role: "user", content: "C'est quoi la garantie légale ? J'ai peur de me tromper.", tone: "unsure, emotional" },
    { id: "cb2", role: "user", content: "Est-ce que c’est dangereux d'acheter sans garantie ?", tone: "risk-prone" },
    { id: "cb3", role: "user", content: "Je peux signer maintenant ? L'agent dit que ça presse.", tone: "high-pressure, emotional", pressure: true }
  ],
  investor_grilling: [
    { id: "ig1", role: "user", content: "Why not just use ChatGPT? What's the technical barrier here?", tone: "analytical, challenging" },
    { id: "ig2", role: "user", content: "What’s your moat in a market where real estate boards hold the forms?", tone: "skeptical" },
    { id: "ig3", role: "user", content: "How do you make money if brokers are reluctant to pay for tech?", tone: "grilling" }
  ]
};

export function getNextUserMessage(scenario: ScenarioType, historyCount: number): SimulationMessage | null {
  const messages = SCENARIOS[scenario];
  if (historyCount < messages.length) {
    return messages[historyCount];
  }
  return null;
}

export const PRESSURE_EVENTS = [
  "Répondez par oui ou par non.",
  "Je n'ai pas le temps pour les longs paragraphes.",
  "Ça n'a aucun sens ce que vous dites.",
  "Est-ce que vous me garantissez que c'est sécuritaire ?"
];

export function getRandomPressure(): string {
  return PRESSURE_EVENTS[Math.floor(Math.random() * PRESSURE_EVENTS.length)];
}
