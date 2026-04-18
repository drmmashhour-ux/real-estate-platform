export type ScalingDay = {
  day: number;
  focus: string;
  actions: string[];
};

export type ScalingBlueprint = {
  id: string;
  days: ScalingDay[];
};
