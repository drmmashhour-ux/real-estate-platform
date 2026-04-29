/** FAQ snippets for LECI simulation / QA demos (FR). */

export type KnowledgePackEntry = {
  question: string;
  answerFr: string;
};

export const KNOWLEDGE_PACK: KnowledgePackEntry[] = [
  {
    question: "C'est quoi la garantie légale ?",
    answerFr:
      "La garantie légale protège contre les défauts cachés. Elle ne remplace pas une inspection préachat ni l’avis d’un courtier lorsque la situation est complexe.",
  },
  {
    question: "Dois-je signer immédiatement ?",
    answerFr:
      "Évitez toute signature hâtive : confirmez d’abord financement et inspection. Sinon, faites-valoir le délai avec votre courtier.",
  },
  {
    question: "Valeur ajoutée de LECI",
    answerFr:
      "LECI structure les risques en langage naturel — utile comme filet, pas comme substitut aux obligations réglementaires d’un courtier agréé.",
  },
];
