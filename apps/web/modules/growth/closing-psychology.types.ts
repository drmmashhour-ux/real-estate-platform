export type ClosingTrigger = "speed" | "scarcity" | "clarity" | "momentum" | "confidence";

export type ClosingTactic = {
  trigger: ClosingTrigger;
  message: string;
  timing: string;
};
