import type { LivePersonaType } from "@/modules/live-training/live-training.types";

export type ScenarioAudience = "BROKER" | "INVESTOR";

export type ScenarioDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

/** DISC-style — maps to live persona simulation */
export type ScenarioPersonality = "DRIVER" | "ANALYTICAL" | "EXPRESSIVE" | "AMIABLE";

export type ScenarioSuccessCondition = "broker_demo_booked" | "investor_meeting_secured";

export type TrainingScenario = {
  id: string;
  title: string;
  description: string;
  goal: string;
  type: ScenarioAudience;
  difficulty: ScenarioDifficulty;
  personality: ScenarioPersonality;
  /** Maps to live-training persona voice */
  livePersona: LivePersonaType;
  opening_line: string;
  /** Progressive objections — later items feel harder */
  objections: string[];
  success_condition: ScenarioSuccessCondition;
};
