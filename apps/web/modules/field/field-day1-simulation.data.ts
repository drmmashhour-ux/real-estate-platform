/**
 * LECIPM Field — Day 1 “twin” simulation (training narrative + branches).
 */

export type OutcomeKind = "success" | "neutral" | "lost" | "weak" | "info";

export type ChoiceOption = {
  id: string;
  label: string;
  /** Shown as agent line after pick. */
  agentLine: string;
  outcome: OutcomeKind;
  outcomeLabel: string;
  feedbackLines: string[];
  /** Drives end-of-day coaching. */
  tags: { mistake?: string; win?: string }[];
};

export type SimNode =
  | {
      id: string;
      timeLabel: string;
      blockTitle: string;
      type: "choice";
      brokerLine: string;
      context?: string;
      options: ChoiceOption[];
    }
  | {
      id: string;
      timeLabel: string;
      blockTitle: string;
      type: "narrative";
      brokerLine?: string;
      agentLine?: string;
      /** Fixed story beat when not branching. */
      outcome: OutcomeKind;
      outcomeLabel: string;
      feedbackLines: string[];
      tags: { mistake?: string; win?: string }[];
    }
  | {
      id: string;
      timeLabel: string;
      blockTitle: string;
      type: "summary";
      /** Shown as narrative; user path may still vary earlier. */
      defaultStats: { calls: number; demos: number; strongLeads: number };
    };

export const DAY1_SIMULATION_NODES: SimNode[] = [
  {
    id: "c1",
    timeLabel: "09:15",
    blockTitle: "Premier appel",
    type: "choice",
    brokerLine: "« J’ai pas le temps. »",
    context: "Réponse alignée sur le script court.",
    options: [
      {
        id: "c1_s",
        label: "Script court + proposition 10 min",
        agentLine:
          "« Je vais être direct : 10 minutes pour te montrer du concret, et si ça ne t’apporte rien, on arrête. »",
        outcome: "neutral",
        outcomeLabel: "Neutre — accès au créneau possible",
        feedbackLines: ["Bien: court", "Mieux: enchaîner sur un créneau de démo (date/heure) tout de suite."],
        tags: [{ win: "script_bref" }, { mistake: "demo_booking_delay" }],
      },
      {
        id: "c1_l",
        label: "Longue explication produit (erreur classique)",
        agentLine: "« En fait, notre plateforme c’est un peu comme… » (longue explication).",
        outcome: "weak",
        outcomeLabel: "Écoute qui se perd",
        feedbackLines: [
          "Trop parler tôt = perte d’énergie d’achat",
          "Recommencer: 1 phrase + 10 min + calendrier",
        ],
        tags: [{ mistake: "over_explain" }],
      },
    ],
  },
  {
    id: "c2",
    timeLabel: "09:30",
    blockTitle: "Deuxième appel",
    type: "choice",
    brokerLine: "« Envoie-moi l’info. »",
    context: "Le piège: envoyer un PDF au lieu d’imposer un créneau.",
    options: [
      {
        id: "c2_l",
        label: "Beaucoup parler, promettre d’envoyer de la matière (erreur du scénario)",
        agentLine: "« OK je t’envoie une présentation complète, et on peut reparler de… »",
        outcome: "lost",
        outcomeLabel: "Piste froide / pas de démo bookée",
        feedbackLines: ["Erreur: monologue", "Aurait dû booker la démo immédiatement (date + heure)."],
        tags: [{ mistake: "over_explain" }, { mistake: "no_demo_book" }],
      },
      {
        id: "c2_w",
        label: "Booker la démo tout de suite",
        agentLine: "« Parfait — je t’enverrai le rappel par mail, mais bloquons 20 minutes cette semaine: mardi 11h, ça te va? »",
        outcome: "success",
        outcomeLabel: "Démo bookée",
        feedbackLines: ["Excellent: tu convertis l’intérêt en rendez-vous", "C’est le bon réflexe terrain."],
        tags: [{ win: "book_demo_fast" }],
      },
    ],
  },
  {
    id: "n3",
    timeLabel: "10:00",
    blockTitle: "Troisième appel",
    type: "narrative",
    brokerLine: "« Ça fait quoi ton système? »",
    agentLine: "Explication simple + offre de démo.",
    outcome: "success",
    outcomeLabel: "Démo bookée",
    feedbackLines: ["Clarté d’abord, démo juste après — bon rythme."],
    tags: [{ win: "clarity" }],
  },
  {
    id: "n4",
    timeLabel: "11:15",
    blockTitle: "Première démo",
    type: "narrative",
    brokerLine: "« J’ai déjà mes outils. »",
    agentLine: "Tu utilises la réponse d’objection (validation + baisse d’erreurs) du script.",
    outcome: "success",
    outcomeLabel: "Intéressé / suite possible",
    feedbackLines: ["Objection traitée proprement, sans se défendre en mode produit."],
    tags: [{ win: "objection_script" }],
  },
  {
    id: "c5",
    timeLabel: "12:00",
    blockTitle: "Deuxième démo",
    type: "choice",
    brokerLine: "Le courtier est silencieux, distrait.",
    context: "Même si tu paniques, ne remplis pas le vide avec un cours.",
    options: [
      {
        id: "c5_m",
        label: "Continuer d’expliquer (erreur classique)",
        agentLine: "« Laisse-moi t’expliquer les 12 options du menu et… »",
        outcome: "weak",
        outcomeLabel: "Engagement faible",
        feedbackLines: ["Silence côté courtier = revenir à eux, poser 1 question ouverte", "Moins d’explication, plus de question."],
        tags: [{ mistake: "over_explain" }, { mistake: "no_questions" }],
      },
      {
        id: "c5_q",
        label: "Poser une question pour réactiver l’échange",
        agentLine: "« Sur ta dernière offre, c’est plutôt le risque côté vérification ou côté délais qui te chipote? »",
        outcome: "neutral",
        outcomeLabel: "Mieux: ré-engagé",
        feedbackLines: ["Bien: question plutôt que monologue", "Ancrer sur son monde réel."],
        tags: [{ win: "use_questions" }],
      },
    ],
  },
  {
    id: "n6",
    timeLabel: "14:30",
    blockTitle: "Troisième démo",
    type: "narrative",
    brokerLine: "« Est-ce que c’est légal? »",
    agentLine: "Réponse prudente: outil d’assistance, validation finale côté courtier.",
    outcome: "success",
    outcomeLabel: "Confiance gagnée",
    feedbackLines: ["Tu restes carré côté responsabilité — c’est rassurant en salle."],
    tags: [{ win: "compliance_safe" }],
  },
  {
    id: "n7",
    timeLabel: "15:30",
    blockTitle: "Relance",
    type: "narrative",
    brokerLine: "« Je vais essayer avec un dossier. »",
    agentLine: "—",
    outcome: "success",
    outcomeLabel: "Essai lancé",
    feedbackLines: ["Passage concret: c’est l’objectif d’une démo de terrain."],
    tags: [{ win: "trial" }],
  },
  {
    id: "s8",
    timeLabel: "16:45",
    blockTitle: "Fin de journée",
    type: "summary",
    defaultStats: { calls: 10, demos: 3, strongLeads: 1 },
  },
];

export const KEY_LESSONS = [
  "Vitesse > perfection (speed > perfection)",
  "Démo > explication (demo > explanation)",
  "Question > monologue (question > talking)",
  "Pousser vers l’usage réel / dossier (push to real use)",
] as const;

export function defaultChoiceId(node: SimNode & { type: "choice" }): string {
  /** Canonical “story” path for first load: first option on c1, first (mistake) on c2, etc. */
  return node.options[0]!.id;
}
