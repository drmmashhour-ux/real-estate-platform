export interface KnowledgeEntry {
  question: string;
  answerFr: string;
  type: "explanation" | "warning" | "guidance";
  requiresEscalation: boolean;
}

export const KNOWLEDGE_PACK: KnowledgeEntry[] = [
  {
    question: "C’est quoi la garantie légale ?",
    answerFr: "La garantie légale protège l’acheteur contre les vices cachés. Si elle est exclue, certains recours peuvent être perdus. Il est important de bien comprendre les conséquences avant de continuer.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "C’est quoi “sans garantie légale” ?",
    answerFr: "Cela signifie que l’acheteur accepte l’immeuble tel quel, avec moins de recours en cas de problème. Une inspection approfondie est fortement recommandée.",
    type: "warning",
    requiresEscalation: false
  },
  {
    question: "Est-ce que c’est valide ?",
    answerFr: "Je peux aider à vérifier les éléments importants, mais une validation finale peut être nécessaire selon la situation.",
    type: "guidance",
    requiresEscalation: true
  },
  {
    question: "Est-ce que je peux enlever la condition de financement ?",
    answerFr: "C’est possible, mais cela augmente le risque pour l’acheteur. Il est recommandé de bien évaluer les conséquences avant de retirer cette condition.",
    type: "warning",
    requiresEscalation: false
  },
  {
    question: "Est-ce que l’inspection est obligatoire ?",
    answerFr: "Non, mais elle est fortement recommandée pour identifier les problèmes potentiels.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Qui paie quoi ?",
    answerFr: "Les frais dépendent de l’entente entre les parties. Certains coûts sont généralement associés à l’acheteur ou au vendeur, mais ils peuvent varier.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "C’est quoi une inclusion ?",
    answerFr: "Une inclusion est un élément qui reste avec la propriété après la vente. Elle doit être clairement identifiée dans le contrat.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce que la borne électrique est incluse ?",
    answerFr: "Cela dépend du contrat. Il est important de préciser explicitement si elle est incluse ou exclue.",
    type: "guidance",
    requiresEscalation: false
  },
  {
    question: "Est-ce que le courtier me représente ?",
    answerFr: "Le courtier peut représenter une partie ou offrir un traitement équitable. Il est important de confirmer votre situation de représentation.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce que je peux annuler ?",
    answerFr: "Dans certains cas, un délai de résiliation peut s’appliquer. Les conditions dépendent du contrat signé.",
    type: "guidance",
    requiresEscalation: false
  },
  {
    question: "Est-ce que je dois accepter ?",
    answerFr: "Cette décision vous appartient. Je peux vous aider à analyser les termes, mais je ne peux pas prendre la décision finale à votre place.",
    type: "guidance",
    requiresEscalation: true
  },
  {
    question: "Est-ce que le prix est correct ?",
    answerFr: "Le prix dépend du marché et de plusieurs facteurs. Un courtier peut aider à analyser la situation.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce risqué ?",
    answerFr: "Certains éléments peuvent présenter des risques. Je peux vous aider à les identifier.",
    type: "warning",
    requiresEscalation: false
  },
  {
    question: "Pourquoi j’ai un avertissement ?",
    answerFr: "L’avertissement indique un élément qui pourrait être incomplet, ambigu ou risqué.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce que je peux continuer ?",
    answerFr: "Certaines étapes doivent être complétées avant de continuer.",
    type: "guidance",
    requiresEscalation: false
  },
  {
    question: "C’est quoi le score ?",
    answerFr: "Le score indique le niveau de complétude et de conformité du document.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce que l’IA décide ?",
    answerFr: "Non. L’IA aide à analyser et suggérer, mais les décisions restent humaines.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Pourquoi je dois confirmer ?",
    answerFr: "Certaines décisions ont des conséquences importantes. La confirmation permet de s’assurer que vous les comprenez.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Est-ce que c’est légal ?",
    answerFr: "Je peux vérifier la conformité structurelle aux formulaires standards, mais une validation légale par un professionnel peut être requise.",
    type: "guidance",
    requiresEscalation: true
  },
  {
    question: "Qu’est-ce que je dois faire ?",
    answerFr: "Je peux vous guider étape par étape selon votre situation.",
    type: "guidance",
    requiresEscalation: false
  },
  {
    question: "Pourquoi j’utiliserais ça ? J'ai déjà mes outils.",
    answerFr: "LECIPM n’a pas pour objectif de remplacer vos outils actuels, mais d’ajouter une couche de validation et d’assistance. Le système détecte les ambiguïtés et vous aide à structurer vos documents plus rapidement.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Je fais ça depuis 10 ans, j'en fais des offres.",
    answerFr: "Absolument, et votre expérience est un avantage important. L’objectif est de réduire le temps passé sur les tâches répétitives et d’ajouter une vérification supplémentaire pour éviter certains oublis.",
    type: "explanation",
    requiresEscalation: false
  },
  {
    question: "Je veux aller vite, j’ai pas le temps.",
    answerFr: "Je comprends. Justement, l’objectif est de vous faire gagner du temps sur la structure du document et les vérifications. Vous pouvez générer une base rapidement, puis ajuster selon votre pratique.",
    type: "guidance",
    requiresEscalation: false
  },
  {
    question: "Est-ce que je peux signer direct si tout est rempli ?",
    answerFr: "Certaines étapes doivent être complétées avant la signature. Le système vérifie que les éléments essentiels sont présents, mais une validation finale est recommandée avant de signer.",
    type: "warning",
    requiresEscalation: true
  }
];
