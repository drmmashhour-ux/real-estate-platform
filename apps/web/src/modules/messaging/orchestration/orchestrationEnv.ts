export function isAutonomousDealCloserEnabled(): boolean {
  return process.env.AI_AUTONOMOUS_DEAL_CLOSER_ENABLED === "1";
}

export function brokerResponseSlaMinutes(): number {
  return Math.max(5, Number(process.env.AI_BROKER_RESPONSE_SLA_MINUTES ?? 30));
}

export function hostResponseSlaMinutes(): number {
  return Math.max(5, Number(process.env.AI_HOST_RESPONSE_SLA_MINUTES ?? 30));
}

export function assignmentAdminFallbackUserId(): string | null {
  const v = process.env.AI_ASSIGNMENT_ADMIN_FALLBACK_USER_ID?.trim();
  return v || null;
}

export function isAutonomousReassignEnabled(): boolean {
  return process.env.AI_AUTONOMOUS_REASSIGN_ENABLED === "1";
}
