export type ScaleStage = "0_to_10k" | "10k_to_100k" | "100k_to_1m";

export type ScaleMilestone = {
  title: string;
  metrics: string[];
  actions: string[];
};

export type ScaleRoadmap = {
  stages: Record<ScaleStage, ScaleMilestone[]>;
};
