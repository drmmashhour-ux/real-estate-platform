/**
 * LECIPM field agent — mandatory word-for-word script (FR).
 * Do not paraphrase on live visits; use discovery questions naturally.
 */

export type ScriptSection = "opening" | "discovery" | "transition" | "demo" | "objection" | "closing";

export type FieldScriptStep = {
  id: string;
  section: ScriptSection;
  /** Single line the agent says aloud (verbatim). */
  line: string;
  /** Optional coach note (not spoken). */
  coachNote?: string;
  /** For objection blocks: the objection (broker) + your reply in `line`. */
  objectionLabel?: string;
};

export const FIELD_SCRIPT_STEPS: FieldScriptStep[] = [
  {
    id: "op1",
    section: "opening",
    line: "Salut, je vais être direct.",
  },
  {
    id: "op2",
    section: "opening",
    line:
      "On travaille avec une plateforme au Québec qui aide les courtiers à aller plus vite sur les offres et éviter certaines erreurs.",
  },
  {
    id: "op3",
    section: "opening",
    line: "Je voulais juste te montrer en 10 minutes, c’est très concret.",
  },
  {
    id: "ds1",
    section: "discovery",
    line: "Tu passes combien de temps par semaine sur les offres et les vérifications ?",
    coachNote: "Laisser parler. Ne couper que pour clarifier.",
  },
  {
    id: "ds2",
    section: "discovery",
    line: "(Attendre la réponse — écoute active.)",
    coachNote: "Discovery (let them talk).",
  },
  {
    id: "tr1",
    section: "transition",
    line: "Parfait, je te montre rapidement.",
  },
  {
    id: "dm1",
    section: "demo",
    line: "Le formulaire est guidé, ça évite les oublis.",
  },
  {
    id: "dm2",
    section: "demo",
    line: "Ici, le système détecte un élément risqué et explique les conséquences.",
  },
  {
    id: "dm3",
    section: "demo",
    line: "L’IA propose des corrections, mais ne remplace pas ton jugement.",
  },
  {
    id: "dm4",
    section: "demo",
    line: "Le score montre si le document est prêt.",
  },
  {
    id: "ob1",
    section: "objection",
    objectionLabel: "J’ai pas le temps",
    line: "Justement, la démo prend 10 minutes et si ça ne t’apporte rien, on arrête.",
  },
  {
    id: "ob2",
    section: "objection",
    objectionLabel: "J’ai déjà des outils",
    line: "On ajoute une couche de validation et réduction des erreurs.",
  },
  {
    id: "ob3",
    section: "objection",
    objectionLabel: "C’est légal ?",
    line: "C’est un outil d’assistance. La validation finale reste avec le courtier.",
  },
  {
    id: "cl1",
    section: "closing",
    line: "On peut tester ça sur un vrai dossier cette semaine.",
  },
];

export const SECTION_TITLES: Record<ScriptSection, string> = {
  opening: "Ouverture (10–15 s)",
  discovery: "Découverte (laisser parler)",
  transition: "Transition",
  demo: "Démo — phrases clés",
  objection: "Objections",
  closing: "Clôture",
};

export const FIELD_DEMO_MAX_MS = 10 * 60 * 1000;
/** Warning when 8 minutes of the 10 have elapsed (2 minutes left). */
export const FIELD_DEMO_WARN_ELAPSED_MS = 8 * 60 * 1000;
