export type BrokerScenarioId = "BUSY" | "SKEPTICAL" | "EXPERIENCED" | "CURIOUS";

export interface BrokerScenario {
  id: BrokerScenarioId;
  name: string;
  description: string;
  initialMessage: string;
  traits: string[];
  objections: string[];
}

export const BROKER_SCENARIOS: BrokerScenario[] = [
  {
    id: "BUSY",
    name: "Busy Broker",
    description: "Impatient, short answers, likely on the road.",
    initialMessage: "Allô? Oui, c'est quoi? J'ai pas beaucoup de temps là, je rentre en visite.",
    traits: ["Impatient", "Direct", "Short attention span"],
    objections: [
      "J'ai déjà trop d'outils.",
      "Ça va me prendre combien de temps votre affaire?",
      "Rappelez-moi plus tard, envoyez-moi un courriel."
    ]
  },
  {
    id: "SKEPTICAL",
    name: "Skeptical Broker",
    description: "Questions everything, doubts AI value, worries about legality.",
    initialMessage: "Écoutez, j'en vois passer des 'révolutions AI' chaque semaine. C'est quoi la différence avec ChatGPT?",
    traits: ["Analytical", "Risk-averse", "Tough questions"],
    objections: [
      "L'AI ça hallucine, c'est pas fiable pour des contrats.",
      "Est-ce que l'OACIQ approuve ça?",
      "Pourquoi je paierais pour ça si j'ai déjà mes formulaires?"
    ]
  },
  {
    id: "EXPERIENCED",
    name: "Experienced Broker",
    description: "20+ years in the game, confident, 'seen it all'.",
    initialMessage: "Je fais ça depuis 25 ans monsieur. Mes contrats sont béton, j'ai pas besoin d'un robot pour me dire quoi faire.",
    traits: ["Confident", "Traditional", "Respect-driven"],
    objections: [
      "Mes clients veulent me parler à MOI, pas à une machine.",
      "L'immobilier c'est une business de relations, pas de data.",
      "J'ai mon propre système qui marche très bien."
    ]
  },
  {
    id: "CURIOUS",
    name: "Curious Broker",
    description: "Open-minded, tech-forward, looking for an edge.",
    initialMessage: "Ah oui? J'ai vu passer votre pub sur Instagram. Ça a l'air intéressant votre système de score de leads.",
    traits: ["Forward-thinking", "Inquisitive", "Action-oriented"],
    objections: [
      "Comment vous calculez le score de probabilité?",
      "Est-ce que je peux importer mes leads actuels?",
      "C'est quoi le coût par lead exactement?"
    ]
  }
];

export interface SimulatorResponse {
  text: string;
  feedback: {
    good: string[];
    toImprove: string[];
    suggestedAnswer: string;
    scores: {
      clarity: number;
      confidence: number;
      closing: number;
    };
  };
}

export function simulateBrokerResponse(
  input: string, 
  scenarioId: BrokerScenarioId,
  history: { role: "user" | "assistant"; content: string }[]
): SimulatorResponse {
  const scenario = BROKER_SCENARIOS.find(s => s.id === scenarioId)!;
  const text = input.toLowerCase();

  // Basic logic to generate a response based on keywords and scenario
  let responseText = "";
  let feedback = {
    good: [] as string[],
    toImprove: [] as string[],
    suggestedAnswer: "",
    scores: { clarity: 0, confidence: 0, closing: 0 }
  };

  // Feedback logic
  if (text.length < 10) {
    feedback.toImprove.push("Your response is too short. Brokers need context and value.");
    feedback.scores.confidence = 20;
  } else {
    feedback.good.push("Good effort in engaging the broker.");
    feedback.scores.confidence = 70;
  }

  if (text.includes("value") || text.includes("deal") || text.includes("close")) {
    feedback.good.push("Focusing on outcomes (closing deals) is key.");
    feedback.scores.clarity = 85;
  } else {
    feedback.toImprove.push("Try to anchor your message to value: 'close more deals' or 'save time'.");
    feedback.scores.clarity = 50;
  }

  if (text.includes("demo") || text.includes("try") || text.includes("show")) {
    feedback.good.push("Strong call to action.");
    feedback.scores.closing = 90;
  } else {
    feedback.toImprove.push("Always guide toward a next step, like a 2-minute demo.");
    feedback.scores.closing = 40;
  }

  // Simulator responses per scenario
  switch (scenarioId) {
    case "BUSY":
      if (text.includes("time") || text.includes("2 minutes")) {
        responseText = "Ok, 2 minutes alors. Expliquez-moi vite comment ça me fait gagner du temps.";
        feedback.suggestedAnswer = "I know you're busy — it literally takes 2 minutes to show you how we prioritize your hot deals so you don't chase the wrong ones.";
      } else {
        responseText = "Écoutez, rappelez-moi demain, là j'ai vraiment pas le temps.";
        feedback.suggestedAnswer = "I'll be brief: we tell you which leads are actually worth your time today. Want to see how in 60 seconds?";
      }
      break;
    case "SKEPTICAL":
      if (text.includes("chatgpt")) {
        responseText = "Ouais, mais ChatGPT ça invente des affaires. Comment je peux faire confiance à votre système?";
        feedback.suggestedAnswer = "We aren't a text generator. We use a structured data layer and OACIQ-aligned logic to guide decisions, not just write words.";
      } else {
        responseText = "C'est beau le marketing, mais concrètement, qu'est-ce que ça change pour mes commissions?";
        feedback.suggestedAnswer = "It reduces uncertainty. We show you which properties are hidden opportunities so your clients close faster.";
      }
      break;
    case "EXPERIENCED":
      responseText = "Intéressant, mais j'ai déjà mes habitudes. Pourquoi je changerais ma façon de faire après toutes ces années?";
      feedback.suggestedAnswer = "Your experience is your biggest asset. We just add a digital layer to it to handle the repetitive triage while you focus on the high-level negotiation.";
      break;
    case "CURIOUS":
      responseText = "Ça a l'air puissant. Est-ce que ça s'intègre avec mon CRM actuel ou c'est séparé?";
      feedback.suggestedAnswer = "It can work alongside any tool. Most brokers use us as their primary 'decision layer' to decide who to call first every morning.";
      break;
  }

  return {
    text: responseText,
    feedback
  };
}
