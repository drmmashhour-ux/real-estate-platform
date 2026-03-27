import type { BnhubGrowthConnector } from "@prisma/client";

export type ConnectorCapability = {
  createCampaign?: boolean;
  syncMetrics?: boolean;
  ingestLeads?: boolean;
  sendFollowup?: boolean;
  realApiReady?: boolean;
  pendingReason?: string;
};

export type ConnectorContext = {
  campaignId: string;
  listingId: string;
  distributionId: string;
  autonomyLevel: string;
};

export type ConnectorResult = {
  ok: boolean;
  externalRef?: string | null;
  summary: string;
  setupRequired?: boolean;
  raw?: Record<string, unknown>;
};

/**
 * Enterprise connector surface — all methods server-side only.
 * External adapters must never fake success when credentials or policy block delivery.
 */
export interface GrowthConnectorAdapter {
  readonly code: string;
  /** Documented env keys for ops (optional on internal connectors). */
  readonly requiredEnvKeys?: readonly string[];
  getCapabilities(): ConnectorCapability;
  validateSetup(): Promise<{ ok: boolean; message: string }>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
  publish(ctx: ConnectorContext): Promise<ConnectorResult>;
  createCampaign(ctx: ConnectorContext): Promise<ConnectorResult>;
  updateCampaign(ctx: ConnectorContext): Promise<ConnectorResult>;
  pauseCampaign(ctx: ConnectorContext): Promise<ConnectorResult>;
  resumeCampaign(ctx: ConnectorContext): Promise<ConnectorResult>;
  syncMetrics(distributionId: string): Promise<ConnectorResult>;
  ingestLeads(payload: Record<string, unknown>): Promise<ConnectorResult>;
  sendFollowup(params: { leadId: string; templateName?: string }): Promise<ConnectorResult>;
  mapErrors(err: unknown): string;
}

export function parseCapabilities(row: BnhubGrowthConnector): ConnectorCapability {
  const j = row.capabilitiesJson;
  if (j && typeof j === "object" && !Array.isArray(j)) return j as ConnectorCapability;
  return {};
}
