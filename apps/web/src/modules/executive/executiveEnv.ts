export function isExecutiveControlEnabled(): boolean {
  return process.env.AI_EXECUTIVE_CONTROL_ENABLED === "1";
}

export function isExecutiveAutoActionsEnabled(): boolean {
  return process.env.AI_EXECUTIVE_AUTO_ACTIONS_ENABLED === "1";
}

export function executiveRecommendationMinPriority(): number {
  return Math.max(0, Math.min(100, Number(process.env.AI_EXECUTIVE_RECOMMENDATION_MIN_PRIORITY ?? 50)));
}

export function executiveLowReplyRateThreshold(): number {
  const v = Number(process.env.AI_EXECUTIVE_LOW_REPLY_RATE_THRESHOLD ?? 0.2);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.2;
}

export function executiveHighStaleRateThreshold(): number {
  const v = Number(process.env.AI_EXECUTIVE_HIGH_STALE_RATE_THRESHOLD ?? 0.5);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
}

export function executiveHighHandoffRateThreshold(): number {
  const v = Number(process.env.AI_EXECUTIVE_HIGH_HANDOFF_RATE_THRESHOLD ?? 0.2);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.2;
}

export function executiveLowHighIntentConversionThreshold(): number {
  const v = Number(process.env.AI_EXECUTIVE_LOW_HIGH_INTENT_CONVERSION_THRESHOLD ?? 0.05);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.05;
}
