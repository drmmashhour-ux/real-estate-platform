/**
 * LECIPM "First 10" Québec broker targeting — Montréal & Laval focus (operator CRM, not a regulator record).
 */

export type FirstQuebecCity = "montreal" | "laval";

export type FirstQuebecSource = "facebook" | "instagram" | "google";

export type FirstQuebecStage =
  | "found"
  | "contacted"
  | "demo_booked"
  | "demo_done"
  | "trial"
  | "paid";

export type FirstQuebecResponseLevel = "none" | "low" | "med" | "high";

export type FirstQuebecBrokerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: FirstQuebecCity;
  source: FirstQuebecSource;
  /** Operator-indicated ICP fit */
  targetIndependent: boolean;
  targetUnderFiveYears: boolean;
  targetSocialActive: boolean;
  targetSmallTeam: boolean;
  /** 1–5 rough priority; higher = more activity/engagement signal */
  activityScore: number;
  responseLevel: FirstQuebecResponseLevel;
  stage: FirstQuebecStage;
  notes: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FirstQuebecSummary = {
  total: number;
  byStage: Record<FirstQuebecStage, number>;
  demosBooked: number;
  /** demo_done + trial + paid */
  conversionsPipeline: number;
  paid: number;
};

export const FIRST_10_DM_TEMPLATE =
  'Salut [Prénom], on a construit un outil au Québec pour aider les courtiers à aller plus vite sur les offres et éviter les erreurs.\n' +
  "Je peux te montrer en 10 min — tu serais ouvert ?";

export const FIRST_10_TARGET = 10;
