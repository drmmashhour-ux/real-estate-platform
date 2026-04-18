/**
 * Growth Fusion — unified read-only intelligence layer (advisory; no execution).
 */

export type GrowthFusionSource = "leads" | "ads" | "cro" | "content" | "autopilot";

export type GrowthFusionSignal = {
  source: GrowthFusionSource;
  id: string;
  type: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  confidence: number;
  priorityScore?: number;
  metadata?: Record<string, unknown>;
};

export type GrowthFusionSummaryStatus = "weak" | "moderate" | "strong";

export type GrowthFusionSummary = {
  status: GrowthFusionSummaryStatus;
  topProblems: string[];
  topOpportunities: string[];
  topActions: string[];
  confidence: number;
  signals: GrowthFusionSignal[];
  grouped: {
    leads: GrowthFusionSignal[];
    ads: GrowthFusionSignal[];
    cro: GrowthFusionSignal[];
    content: GrowthFusionSignal[];
    autopilot: GrowthFusionSignal[];
  };
  createdAt: string;
};

export type GrowthFusionAction = {
  id: string;
  title: string;
  description: string;
  source: GrowthFusionSource;
  impact: "low" | "medium" | "high";
  confidence: number;
  priorityScore: number;
  why: string;
  executionMode: "manual_only" | "approval_required";
  status?: "suggested" | "approved" | "rejected" | "executed";
};

/** Result of `buildGrowthFusionSystem()`. */
export type GrowthFusionSystemResult = {
  snapshot: import("./growth-fusion-snapshot.service").GrowthFusionRawSnapshot;
  summary: GrowthFusionSummary;
  actions: GrowthFusionAction[];
};
