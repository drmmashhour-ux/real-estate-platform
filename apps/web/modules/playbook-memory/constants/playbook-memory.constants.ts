/** Safety default: messaging domain never auto-executes from memory engine. */
export const HIGH_RISK_MEMORY_DOMAINS = new Set<string>(["MESSAGING", "RISK"]);

/** External outbound messaging must not be triggered by playbook automation (policy). */
export const DISALLOW_AUTOPILOT_ACTION_TYPES = new Set<string>([
  "send_customer_message",
  "external_sms",
  "external_whatsapp",
]);
