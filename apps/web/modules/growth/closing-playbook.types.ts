export type ClosingStep = {
  step: number;
  title: string;
  actions: string[];
};

export type ClosingPlaybook = {
  id: string;
  steps: ClosingStep[];
};
