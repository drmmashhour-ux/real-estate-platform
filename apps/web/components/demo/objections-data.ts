export type BrokerObjection = {
  id: string;
  number: number;
  objection: string;
  /** Word-for-word reply — paragraphs separated for display */
  replyParagraphs: string[];
};

export const BROKER_OBJECTIONS: BrokerObjection[] = [
  {
    id: "objection-temps",
    number: 1,
    objection: "J’ai pas le temps",
    replyParagraphs: [
      "Je comprends totalement.",
      "Justement, c’est pour ça. La démo prend 10 minutes et si ça ne t’apporte rien, on arrête là.",
    ],
  },
  {
    id: "objection-outils",
    number: 2,
    objection: "J’ai déjà mes outils",
    replyParagraphs: [
      "Parfait.",
      "Nous, on ne remplace pas, on ajoute une couche: validation + réduction des erreurs + possibilité de leads.",
    ],
  },
  {
    id: "objection-encadres",
    number: 3,
    objection: "Mes clients sont déjà encadrés",
    replyParagraphs: [
      "C’est justement là où ça aide: moins d’erreurs, plus rapide, et plus clair pour le client.",
    ],
  },
  {
    id: "objection-experience",
    number: 4,
    objection: "Je fais ça depuis longtemps",
    replyParagraphs: [
      "Encore mieux.",
      "Tu vas voir rapidement si ça t’aide à aller plus vite sur les tâches répétitives.",
    ],
  },
  {
    id: "objection-legal",
    number: 5,
    objection: "C’est légal ?",
    replyParagraphs: [
      "Ce n’est pas un remplacement légal.",
      "C’est un outil qui aide à structurer, vérifier et réduire les risques. Le courtier garde toujours le contrôle.",
    ],
  },
];

export type DemoScriptBlock = {
  id: string;
  phase: "START" | "MIDDLE" | "RISK" | "AI" | "CLOSE";
  label: string;
  text: string;
};

export const DEMO_SCRIPT_BLOCKS: DemoScriptBlock[] = [
  {
    id: "script-start",
    phase: "START",
    label: "Start",
    text: "Salut, je vais être direct.\n\nJe te montre comment créer et sécuriser une offre en quelques minutes.",
  },
  {
    id: "script-middle",
    phase: "MIDDLE",
    label: "Middle",
    text: "Le formulaire est guidé.\n\nÇa évite les oublis et les erreurs.",
  },
  {
    id: "script-risk",
    phase: "RISK",
    label: "Risk",
    text: "Ici, le système détecte un choix risqué et explique les conséquences.",
  },
  {
    id: "script-ai",
    phase: "AI",
    label: "AI",
    text: "L’IA analyse et propose des corrections concrètes.",
  },
  {
    id: "script-close",
    phase: "CLOSE",
    label: "Close",
    text: "Si tu veux, on peut tester ça sur un vrai dossier.",
  },
];
