/**
 * Optional ML assist — never authoritative; deterministic rules always win upstream.
 */

export interface HybridRiskAdapterInput {
  entityType?: string;
  actionType?: string;
  regionCode?: string;
  metadata?: Record<string, unknown>;
}

export interface HybridRiskAdapterResult {
  available: boolean;
  modelVersion?: string;
  /** 0..1 when available */
  mlScore?: number;
  explanation?: string;
}

export async function getHybridMlRiskScore(_input: HybridRiskAdapterInput): Promise<HybridRiskAdapterResult> {
  return {
    available: false,
  };
}
