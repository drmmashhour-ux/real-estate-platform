/**
 * LECIPM field — default daily time blocks (Québec, office day).
 * Ops can version this file or load from CMS later.
 */

export type ChecklistTask = {
  id: string;
  label: string;
};

export type ChecklistBlock = {
  id: string;
  timeLabel: string;
  title: string;
  subtitle?: string;
  kind: "work" | "break";
  /** Optional goal / rules shown in UI. */
  goalLine?: string;
  rules?: string[];
  tasks: ChecklistTask[];
};

export const FIELD_DAILY_BLOCKS: ChecklistBlock[] = [
  {
    id: "b09pre",
    timeLabel: "09:00 – 09:15",
    title: "Mise en route",
    kind: "work",
    tasks: [
      { id: "t1", label: "Relire les leads" },
      { id: "t2", label: "Ouvrir le tableau de bord" },
      { id: "t3", label: "Préparer le script" },
    ],
  },
  {
    id: "b0915",
    timeLabel: "09:15 – 10:30",
    title: "Bloc 1 — Prospection",
    subtitle: "OUTREACH BLOCK 1",
    kind: "work",
    goalLine: "Objectif : booker 1–2 démos",
    tasks: [
      { id: "t1", label: "Appeler 5 courtiers" },
      { id: "t2", label: "Envoyer 5 DM" },
    ],
  },
  {
    id: "b1030",
    timeLabel: "10:30 – 11:00",
    title: "Relances & confirmations",
    subtitle: "FOLLOW-UP",
    kind: "work",
    tasks: [
      { id: "t1", label: "Relancer les leads plus anciens" },
      { id: "t2", label: "Confirmer les démos prévues" },
    ],
  },
  {
    id: "b11",
    timeLabel: "11:00 – 13:00",
    title: "Bloc démos",
    subtitle: "DEMO BLOCK",
    kind: "work",
    goalLine: "Mener 2–3 démos",
    rules: ["Max. 10 min par démo", "Suivre le script mot à mot"],
    tasks: [
      { id: "t1", label: "Démo 1" },
      { id: "t2", label: "Démo 2" },
      { id: "t3", label: "Démo 3 (optionnelle)" },
    ],
  },
  {
    id: "b13",
    timeLabel: "13:00 – 14:00",
    title: "Pause",
    kind: "break",
    tasks: [{ id: "t1", label: "Pause — se déconnecter du téléphone" }],
  },
  {
    id: "b14",
    timeLabel: "14:00 – 15:00",
    title: "Bloc 2 — Prospection",
    subtitle: "OUTREACH BLOCK 2",
    kind: "work",
    tasks: [
      { id: "t1", label: "Appeler 5 courtiers de plus" },
      { id: "t2", label: "Envoyer 5 DM" },
    ],
  },
  {
    id: "b15",
    timeLabel: "15:00 – 16:00",
    title: "Démo / pousser l’essai",
    subtitle: "DEMO / TRIAL PUSH",
    kind: "work",
    tasks: [
      { id: "t1", label: "Mener des démos OU" },
      { id: "t2", label: "Pousser les courtiers vers un vrai dossier d’essai" },
    ],
  },
  {
    id: "b16a",
    timeLabel: "16:00 – 16:30",
    title: "Relances + clôture",
    subtitle: "FOLLOW-UP + CLOSING",
    kind: "work",
    tasks: [
      { id: "t1", label: "Écrire aux courtiers intéressés" },
      { id: "t2", label: "Pousser vers un premier brouillon" },
    ],
  },
  {
    id: "b1630",
    timeLabel: "16:30 – 17:00",
    title: "Rapport de fin de journée",
    subtitle: "REPORT",
    kind: "work",
    tasks: [
      { id: "t1", label: "Enregistrer les résultats" },
      { id: "t2", label: "Mettre à jour les statuts" },
      { id: "t3", label: "Notes" },
    ],
  },
];

export const CHECKLIST_DOS = [
  "Garder la démo sous 10 min",
  "Suivre le script",
  "Poser des questions",
  "Pousser vers l’usage réel",
] as const;

export const CHECKLIST_DONTS = [
  "Ne pas trop expliquer",
  "Ne pas improviser le script",
  "Ne pas sauter les relances",
] as const;
