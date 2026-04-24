/** Serializable DTOs for public/internal API boundaries — stubs until wired to persistence. */

export type LeadRecord = {
  id: string;
  source: string;
  status: string;
  createdAt: string;
  partnerId?: string;
};

export type DealRecord = {
  id: string;
  title: string;
  stage: string;
  updatedAt: string;
  partnerId?: string;
};

export type MessageThreadRecord = {
  id: string;
  channel: string;
  lastMessageAt: string;
  preview: string;
};

export type AnalyticsInsight = {
  id: string;
  metric: string;
  value: number;
  period: string;
  notes?: string;
};
