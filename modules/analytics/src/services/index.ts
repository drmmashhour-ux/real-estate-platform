import type { Metric } from "../models/index.js";

export interface AnalyticsService {
  getMetrics(period: string): Promise<Metric[]>;
}

export const analyticsServiceStub: AnalyticsService = {
  async getMetrics() {
    return [];
  },
};
