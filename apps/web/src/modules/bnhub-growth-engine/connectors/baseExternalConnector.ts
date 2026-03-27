import type { GrowthConnectorAdapter, ConnectorResult, ConnectorContext } from "./types";

/** External ads/messaging: never fake success — surface setup_required until credentials + policy OK. */
export abstract class BasePendingExternalConnector implements GrowthConnectorAdapter {
  abstract readonly code: string;
  protected abstract displayName: string;
  readonly requiredEnvKeys: readonly string[] = [];

  getCapabilities() {
    return {
      createCampaign: true,
      syncMetrics: true,
      ingestLeads: true,
      sendFollowup: this.code === "whatsapp_business",
      realApiReady: false,
      pendingReason: "Business verification + OAuth + approved ad/account not configured in this environment.",
    };
  }

  async validateSetup(): Promise<{ ok: boolean; message: string }> {
    const missing = this.requiredEnvKeys.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      return {
        ok: false,
        message: `${this.displayName}: set server env ${missing.join(", ")} first; then complete OAuth / app review. Webhooks need a verified signature secret in production.`,
      };
    }
    return {
      ok: false,
      message: `${this.displayName}: env keys present but Marketing API wiring is still pending — use Admin → Growth → Connectors for rollout checklist.`,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    return this.validateSetup();
  }

  protected async setupBlockedResult(ctx: ConnectorContext): Promise<ConnectorResult> {
    const v = await this.validateSetup();
    return {
      ok: false,
      setupRequired: true,
      summary: v.message,
      raw: { distributionId: ctx.distributionId, connector: this.code, mockExternal: true },
    };
  }

  async publish(ctx: ConnectorContext): Promise<ConnectorResult> {
    return this.setupBlockedResult(ctx);
  }

  async createCampaign(ctx: ConnectorContext): Promise<ConnectorResult> {
    return this.setupBlockedResult(ctx);
  }

  async updateCampaign(ctx: ConnectorContext): Promise<ConnectorResult> {
    return this.setupBlockedResult(ctx);
  }

  async pauseCampaign(ctx: ConnectorContext): Promise<ConnectorResult> {
    return this.setupBlockedResult(ctx);
  }

  async resumeCampaign(ctx: ConnectorContext): Promise<ConnectorResult> {
    return this.setupBlockedResult(ctx);
  }

  async syncMetrics(_distributionId: string): Promise<ConnectorResult> {
    const v = await this.validateSetup();
    return {
      ok: false,
      setupRequired: true,
      summary: `Metrics sync blocked: ${v.message}`,
      raw: { mockExternal: true, connector: this.code },
    };
  }

  async ingestLeads(_payload: Record<string, unknown>): Promise<ConnectorResult> {
    const v = await this.validateSetup();
    return {
      ok: false,
      setupRequired: true,
      summary: `Lead ingest API not live: ${v.message}`,
      raw: { mockExternal: true },
    };
  }

  async sendFollowup(_params: { leadId: string; templateName?: string }): Promise<ConnectorResult> {
    const v = await this.validateSetup();
    return {
      ok: false,
      setupRequired: true,
      summary: `Follow-up blocked: ${v.message}`,
      raw: { mockExternal: true },
    };
  }

  mapErrors(err: unknown): string {
    const s = err instanceof Error ? err.message : String(err);
    if (/429|rate\s*limit|too many requests/i.test(s)) {
      return `Rate limit / throttling — back off and retry: ${s}`;
    }
    if (/401|403|unauthor|invalid.?token|expired/i.test(s)) {
      return `Auth or token issue (refresh OAuth / system user token): ${s}`;
    }
    if (/timeout|ETIMEDOUT|ECONNRESET/i.test(s)) {
      return `Network error — retry with exponential backoff: ${s}`;
    }
    return s;
  }
}
