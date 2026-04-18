export type MoatType =
  | "data"
  | "network_effect"
  | "ai_learning"
  | "supply_control"
  | "brand";

export type MoatSignal = {
  type: MoatType;
  strength: number;
  description: string;
};
