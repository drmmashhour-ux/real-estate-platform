export type AllocationWeights = {
  buySignalWeight: number;
  occupancyWeight: number;
  revparWeight: number;
  upliftWeight: number;
  riskPenalty: number;
};

const DEFAULT_WEIGHTS: AllocationWeights = {
  buySignalWeight: 20,
  occupancyWeight: 10,
  revparWeight: 8,
  upliftWeight: 12,
  riskPenalty: 25,
};

/** Loads current weights. In V2.1 this could fetch from DB. */
export async function getAllocationWeights(): Promise<AllocationWeights> {
  // For V2, we use deterministic defaults.
  // Learning loop updates these via updateAllocationWeights (persisted in future).
  return DEFAULT_WEIGHTS;
}

/** Updates weights based on learning loop outcomes. */
export async function updateAllocationWeights(updates: Partial<AllocationWeights>): Promise<void> {
  console.info("[capital-allocator][learning] Updating weights:", updates);
  // Future: Persist next weights to platform config or autonomy settings.
}
