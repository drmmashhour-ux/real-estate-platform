/**
 * Pluggable per-domain rules for the Playbook Memory Engine (Wave 11).
 * Keep modules pure where possible; callers catch failures and fall back to generic engine behavior.
 */
export type PlaybookDomainModule = {
  domain: string;

  buildContext(input: any): Promise<any>;

  computeReward(params: {
    realizedValue?: number;
    realizedRevenue?: number;
    realizedConversion?: number;
    riskScore?: number;
  }): number | null;

  getExecutionAdapter(): {
    canExecute(actionType: string): boolean;
    execute(actionType: string, payload: any): Promise<{ success: boolean }>;
  };

  getSafetyRules(): {
    blockedActionTypes: string[];
    maxRiskScore?: number;
  };
};
