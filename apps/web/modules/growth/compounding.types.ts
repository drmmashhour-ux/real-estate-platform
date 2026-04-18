export type CompoundingAction = {
  title: string;
  actions: string[];
};

export type CompoundingPlan = {
  actions: CompoundingAction[];
};
