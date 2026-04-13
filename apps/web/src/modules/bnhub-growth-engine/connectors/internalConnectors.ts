import type { GrowthConnectorAdapter, ConnectorResult, ConnectorContext } from "./types";

const internalMetrics = (code: string, distributionId: string): ConnectorResult => ({
  ok: true,
  summary: `${code}: internal channel — aggregate metrics via BNHUB analytics (connector sync stub; not paid ads).`,
  raw: { distributionId, internalMeasured: true },
});

abstract class InternalGrowthConnector implements GrowthConnectorAdapter {
  abstract readonly code: string;

  abstract publish(ctx: ConnectorContext): Promise<ConnectorResult>;

  getCapabilities() {
    return { realApiReady: true, createCampaign: true, syncMetrics: true };
  }

  async validateSetup() {
    return { ok: true, message: "Internal BNHUB connector — no third-party OAuth." };
  }

  async healthCheck() {
    return { ok: true, message: "OK" };
  }

  async createCampaign(ctx: ConnectorContext) {
    return this.publish(ctx);
  }

  async updateCampaign(ctx: ConnectorContext) {
    return {
      ok: true,
      summary: "Internal connector — creative updates flow through asset approval on platform.",
      raw: { listingId: ctx.listingId, internal: true },
    };
  }

  async pauseCampaign(ctx: ConnectorContext) {
    return {
      ok: true,
      summary: "Pause/resume is driven by campaign status in BNHUB (internal slot released on pause).",
      raw: { campaignId: ctx.campaignId, internal: true },
    };
  }

  async resumeCampaign(ctx: ConnectorContext) {
    return {
      ok: true,
      summary: "Internal connector — resume follows campaign ACTIVE status in BNHUB.",
      raw: { campaignId: ctx.campaignId, internal: true },
    };
  }

  async syncMetrics(distributionId: string) {
    return internalMetrics(this.code, distributionId);
  }

  async ingestLeads(_payload: Record<string, unknown>): Promise<ConnectorResult> {
    return {
      ok: false,
      summary: "Internal connectors do not ingest via Marketing API — use promo forms / webhooks.",
      setupRequired: false,
    };
  }

  async sendFollowup(_params: { leadId: string; templateName?: string }): Promise<ConnectorResult> {
    return {
      ok: false,
      summary: "Not applicable for this internal connector.",
      setupRequired: false,
    };
  }

  mapErrors(err: unknown) {
    return err instanceof Error ? err.message : String(err);
  }
}

export class InternalHomepageConnector extends InternalGrowthConnector {
  readonly code = "internal_homepage";

  async publish(ctx: ConnectorContext): Promise<ConnectorResult> {
    return {
      ok: true,
      externalRef: `internal:homepage:${ctx.listingId}`,
      summary: "Internal homepage feature (measured on BNHUB).",
      raw: { listingId: ctx.listingId, internal: true },
    };
  }
}

export class InternalSearchBoostConnector extends InternalGrowthConnector {
  readonly code = "internal_search_boost";

  async publish(ctx: ConnectorContext): Promise<ConnectorResult> {
    const cap = 10;
    return {
      ok: true,
      externalRef: `internal:search_boost:${ctx.listingId}`,
      summary: `Search boost +${cap} (capped, auditable).`,
      raw: { listingId: ctx.listingId, boostPoints: cap, internal: true },
    };
  }
}

export class InternalEmailConnector extends InternalGrowthConnector {
  readonly code = "internal_email";

  async publish(ctx: ConnectorContext): Promise<ConnectorResult> {
    return {
      ok: true,
      externalRef: `internal:email_queue:${ctx.listingId}`,
      summary: "Internal email card queued (segment TBD).",
      raw: { listingId: ctx.listingId, queued: true, internal: true },
    };
  }
}
