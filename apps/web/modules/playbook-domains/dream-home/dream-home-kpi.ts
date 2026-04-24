import { computeDreamHomeKpiCore, type DreamHomeKpiInput, computeDreamHomeReward } from './dream-home-kpi-signals';

export type { DreamHomeKpiInput };
export { computeDreamHomeReward };

/**
 * Playbook memory bandit: maps assignment outcome to reward. Delegates to explicit-signal core.
 */
export function computeDreamHomeKpiReward(params: {
  realizedValue?: number;
  realizedRevenue?: number;
  realizedConversion?: number;
  riskScore?: number;
}): number | null {
  return computeDreamHomeReward({ ...params });
}

/** Alias for memory layer when logging interaction-rich outcomes. */
export { computeDreamHomeKpiCore };
