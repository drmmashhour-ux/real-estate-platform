export type DemoTrainingStep = {
  id: string;
  stepNumber: number;
  title: string;
  /** French presenter script */
  script: string;
  /** What appears on screen */
  show?: string;
  /** Where to click / navigate (practice mode highlight) */
  action?: string;
  /** Short on-screen cue */
  visualCue?: string;
  /** Optional trigger to mention */
  trigger?: string;
};

export const DEMO_TRAINING_STEPS: DemoTrainingStep[] = [
  {
    id: "hook",
    stepNumber: 1,
    title: "Start Strong",
    script: "Je vais te montrer comment créer et sécuriser une offre en quelques minutes.",
    show: "Écran d’accueil ou vue courtier — ton énergie pose le cadre.",
    action: "Accueillir, puis annoncer le fil direct jusqu’à la signature.",
    visualCue: "Hook",
  },
  {
    id: "listing",
    stepNumber: 2,
    title: "Listing Entry",
    script: "On part directement d’une propriété.",
    show: "Page annonce (fiche propriété).",
    action: "Fiche propriété → « Faire une offre (Turbo) »",
    visualCue: "Listing · Turbo",
  },
  {
    id: "guided-form",
    stepNumber: 3,
    title: "Guided Form",
    script: "Le formulaire est guidé, comme si un courtier assistait le client.",
    show: "Form stepper (étapes numérotées).",
    action: "Faire défiler une étape à la fois — ne pas sauter.",
    visualCue: "Stepper",
  },
  {
    id: "risk",
    stepNumber: 4,
    title: "Risk Example",
    script: "Ici, le système détecte un choix risqué et explique les conséquences.",
    show: "Panneau risques / avis.",
    trigger: "Exclusion de garantie (warranty exclusion)",
    action: "Ouvrir ou simuler le choix risqué → laisser lire l’explication.",
    visualCue: "Risque",
  },
  {
    id: "ai-review",
    stepNumber: 5,
    title: "AI Review",
    script: "L’IA identifie les erreurs et propose des améliorations concrètes.",
    show: "Suggestions / révision IA.",
    action: "Montrer une suggestion acceptée vs. refusée.",
    visualCue: "IA",
  },
  {
    id: "compliance",
    stepNumber: 6,
    title: "Compliance Score",
    script: "On voit immédiatement si le document est prêt ou risqué.",
    show: "Score de conformité / badge.",
    action: "Pointer le score avant de parler signature.",
    visualCue: "Score",
  },
  {
    id: "signature-gate",
    stepNumber: 7,
    title: "Signature Gate",
    script: "Impossible de signer sans validation complète.",
    show: "Signature bloquée ou message gate.",
    action: "Montrer le blocage tant que score / avis / champs requis manquent.",
    visualCue: "Gate",
  },
  {
    id: "close",
    stepNumber: 8,
    title: "Close",
    script: "On peut tester ça ensemble sur un vrai dossier.",
    show: "Transition vers essai réel ou Q&R.",
    action: "Prochain rendez-vous ou envoi du lien Turbo.",
    visualCue: "Close",
  },
];

export const DEMO_TALKING_POINTS: string[] = [
  "Gardez le rythme : une étape = une idée — ne chargez pas l’écran.",
  "Pause aux étapes 4 (risque) et 7 (signature) : c’est là que la valeur se voit.",
  "Répétez la phrase-clé du score : « prêt vs risqué », pas le jargon technique.",
  "Si on vous coupe, revenez au script de l’étape en cours — ce guide est l’ordre officiel.",
  "Partagez ce lien en interne : même démo, même qualité pour toute l’équipe.",
];
