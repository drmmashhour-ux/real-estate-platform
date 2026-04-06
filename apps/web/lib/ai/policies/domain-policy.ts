/**
 * Domain ↔ autonomy boundaries (complements action-key classification in action-policy.ts).
 */

export type AutonomyDomain =
  | "listings"
  | "bookings"
  | "payments"
  | "payouts"
  | "messaging"
  | "trust_safety"
  | "growth"
  | "admin_insights"
  | "host_autopilot";

export type ActionClass =
  | "SAFE_AUTOMATIC"
  | "SAFE_WITH_NOTICE"
  | "SAFE_WITH_LOG_ONLY"
  | "APPROVAL_OPTIONAL"
  | "APPROVAL_REQUIRED"
  | "BLOCKED";

export function actionClassForDomainTool(domain: AutonomyDomain, toolKey: string): ActionClass {
  if (domain === "payments" || domain === "payouts") {
    if (toolKey.includes("read") || toolKey.startsWith("get")) return "SAFE_WITH_LOG_ONLY";
    return "APPROVAL_REQUIRED";
  }
  if (domain === "trust_safety") {
    if (toolKey.includes("summarize") || toolKey.includes("recommendation")) return "SAFE_AUTOMATIC";
    return "APPROVAL_REQUIRED";
  }
  if (domain === "messaging") {
    if (toolKey.includes("draft") || toolKey.includes("template")) return "SAFE_AUTOMATIC";
    if (toolKey.includes("send")) return "APPROVAL_REQUIRED";
    return "APPROVAL_OPTIONAL";
  }
  if (domain === "listings") {
    if (toolKey.includes("draft") || toolKey.includes("suggest")) return "SAFE_AUTOMATIC";
    if (toolKey.includes("price") && toolKey.includes("live")) return "APPROVAL_REQUIRED";
    return "APPROVAL_OPTIONAL";
  }
  return "APPROVAL_OPTIONAL";
}

export function domainPaused(domain: AutonomyDomain, domainKillSwitchesJson: unknown): boolean {
  if (!domainKillSwitchesJson || typeof domainKillSwitchesJson !== "object") return false;
  const o = domainKillSwitchesJson as Record<string, unknown>;
  return Boolean(o[domain]);
}
