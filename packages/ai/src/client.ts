/**
 * AI Control Center – client for admin dashboard. All functions are mock-safe (return empty data on error).
 */

const API = "/api/ai";

export type AiLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  riskScore: number | null;
  trustLevel: string | null;
  trustScore: number | null;
  recommendedPriceCents: number | null;
  details: unknown;
  createdAt: string;
};

export type AiLogsResponse = {
  logs: AiLogEntry[];
  summary: {
    totalEvaluations: number;
    flaggedRisks: number;
    avgTrustScore: number | null;
    totalLogs: number;
  };
};

export type FraudAlertItem = {
  id: string;
  type: "score" | "alert";
  listingId: string;
  listing: { id: string; title: string | null; address: string | null; city: string | null; listingStatus?: string } | null;
  fraudScore?: number;
  riskLevel?: string;
  reasons?: unknown;
  alertType?: string;
  severity?: string;
  message?: string;
  status?: string;
  createdAt: string;
};

export type PricingSuggestionItem = {
  id: string;
  listingId: string;
  recommendedCents: number;
  minCents: number | null;
  maxCents: number | null;
  demandLevel: string | null;
  modelVersion: string | null;
  forDate: string | null;
  createdAt: string;
};

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, { ...init, credentials: "same-origin" });
    if (!res.ok) return [] as unknown as T;
    return res.json() as Promise<T>;
  } catch {
    return [] as unknown as T;
  }
}

/** Fetch AI logs with optional action filter. Returns logs + summary. */
export async function getAiLogs(params?: {
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<AiLogsResponse> {
  const sp = new URLSearchParams();
  if (params?.action) sp.set("action", params.action);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const url = `${API}/logs?${sp.toString()}`;
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<AiLogsResponse>;
  } catch {
    return {
      logs: [],
      summary: { totalEvaluations: 0, flaggedRisks: 0, avgTrustScore: null, totalLogs: 0 },
    };
  }
}

/** Recent evaluate actions from AI logs. */
export async function getAiEvaluations(limit = 50): Promise<AiLogEntry[]> {
  const data = await getAiLogs({ action: "evaluate", limit });
  return Array.isArray(data.logs) ? data.logs : [];
}

/** Fraud alerts (high-risk scores + property fraud alerts). */
export async function getFraudAlerts(): Promise<FraudAlertItem[]> {
  const data = await safeFetch<{ alerts: FraudAlertItem[] }>(`${API}/fraud-alerts`);
  return Array.isArray(data?.alerts) ? data.alerts : [];
}

/** Recent pricing suggestions from stored recommendations. */
export async function getPricingSuggestions(limit = 30): Promise<PricingSuggestionItem[]> {
  const data = await safeFetch<{ suggestions: PricingSuggestionItem[] }>(
    `${API}/suggestions/pricing?limit=${limit}`
  );
  return Array.isArray(data?.suggestions) ? data.suggestions : [];
}

/** Recent trust_score actions from AI logs. */
export async function getTrustScores(limit = 50): Promise<AiLogEntry[]> {
  const data = await getAiLogs({ action: "trust_score", limit });
  return Array.isArray(data.logs) ? data.logs : [];
}

/** Re-run evaluation for an entity. */
export async function runEvaluation(entityType: string, entityId: string): Promise<{ riskScore?: number; trustLevel?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Evaluation failed" };
    return { riskScore: data.riskScore, trustLevel: data.trustLevel };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed" };
  }
}

/** Re-run fraud check for listing or user/booking. */
export async function runFraudCheck(params: {
  listingId?: string;
  userId?: string;
  bookingId?: string;
}): Promise<{ riskScore?: number; recommendedAction?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/fraud-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Fraud check failed" };
    return { riskScore: data.riskScore, recommendedAction: data.recommendedAction };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed" };
  }
}

/** Refresh trust score for user or listing. */
export async function refreshTrustScore(params: { userId?: string; listingId?: string; recompute?: boolean }): Promise<{ trustScore?: number; trustLevel?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/trust-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Trust score failed" };
    return { trustScore: data.trustScore, trustLevel: data.trustLevel };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed" };
  }
}

/** Refresh pricing suggestion for a listing. */
export async function refreshPricingSuggestion(listingId: string): Promise<{ recommendedPrice?: number; recommendedPriceCents?: number; error?: string }> {
  try {
    const res = await fetch(`${API}/price-suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || "Pricing failed" };
    return { recommendedPrice: data.recommendedPrice, recommendedPriceCents: data.recommendedPriceCents };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed" };
  }
}
