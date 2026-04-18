export type BrokerLockInSignal = {
  brokerId: string;
  /** 0–1 advisory composite — explainable from factors; not a legal/financial claim. */
  dependencyScore: number;
  factors: string[];
  /** Same tier as broker competition view — transparent routing signal. */
  tier: "standard" | "preferred" | "elite";
};

export type BrokerLockInTierId = "STANDARD" | "PREFERRED" | "ELITE";
