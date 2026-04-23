import type {
  AutopilotDomainMatrixRow,
  FullAutopilotMode,
  LecipmAutopilotDomainId,
} from "./autopilot-domain-matrix.types";

/** Static product matrix — database may override `mode` / `killSwitch` per domain. */
const DOMAIN_MATRIX: Record<LecipmAutopilotDomainId, AutopilotDomainMatrixRow> = {
  marketing_content_generation: {
    domain: "marketing_content_generation",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_BOUNDED", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "ASSIST",
    requiresApproval: false,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Drafts and calendar fills are reversible; publishing still policy-gated in v1 unless low-risk connector.",
  },
  marketing_scheduling: {
    domain: "marketing_scheduling",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_BOUNDED", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "ASSIST",
    requiresApproval: false,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Scheduling changes are reversible when not yet published.",
  },
  marketing_publishing: {
    domain: "marketing_publishing",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL", "FULL_AUTOPILOT_BOUNDED"],
    defaultMode: "FULL_AUTOPILOT_APPROVAL",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "MEDIUM",
    reason: "Outbound publish can affect brand and compliance — default needs approval.",
  },
  lead_routing: {
    domain: "lead_routing",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_BOUNDED", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "SAFE_AUTOPILOT",
    requiresApproval: false,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Routing to best-fit broker is low-impact and reversible pre-contact.",
  },
  ai_followup_sequences: {
    domain: "ai_followup_sequences",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "ASSIST",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "MEDIUM",
    reason: "Messaging can be regulatory sensitive — bounded auto for pre-approved templates only.",
  },
  booking_slot_suggestion: {
    domain: "booking_slot_suggestion",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_BOUNDED"],
    defaultMode: "SAFE_AUTOPILOT",
    requiresApproval: false,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Suggestions only; booking confirmation remains user/broker-controlled.",
  },
  no_show_reminders: {
    domain: "no_show_reminders",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_BOUNDED"],
    defaultMode: "SAFE_AUTOPILOT",
    requiresApproval: false,
    supportsRollback: false,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Operational reminders reduce churn; low contractual risk.",
  },
  post_visit_followups: {
    domain: "post_visit_followups",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "ASSIST",
    requiresApproval: false,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "LOW",
    reason: "Follow-up templates are advisory; escalate when content is non-template.",
  },
  broker_assistant_actions: {
    domain: "broker_assistant_actions",
    allowedModes: ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "ASSIST",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "MEDIUM",
    reason: "Only whitelisted one-click actions may auto-run; others queue.",
  },
  deal_intelligence_guided_actions: {
    domain: "deal_intelligence_guided_actions",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL", "FULL_AUTOPILOT_BOUNDED"],
    defaultMode: "ASSIST",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "HIGH",
    reason: "Deal state changes can be legally material — approval by default.",
  },
  capital_allocator_recommendations: {
    domain: "capital_allocator_recommendations",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "FULL_AUTOPILOT_APPROVAL",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "HIGH",
    reason: "Advisory-only; no auto capital deployment.",
  },
  marketplace_optimization_proposals: {
    domain: "marketplace_optimization_proposals",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL", "FULL_AUTOPILOT_BOUNDED"],
    defaultMode: "FULL_AUTOPILOT_APPROVAL",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "HIGH",
    reason: "Uses existing autonomy decision + apply path; never blind auto-apply in v1.",
  },
  pricing: {
    domain: "pricing",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "FULL_AUTOPILOT_APPROVAL",
    requiresApproval: true,
    supportsRollback: true,
    supportsKillSwitch: true,
    riskLevel: "CRITICAL",
    reason: "Pricing touches revenue and trust — never auto without explicit approval policy.",
  },
  investment_actions: {
    domain: "investment_actions",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "FULL_AUTOPILOT_APPROVAL",
    requiresApproval: true,
    supportsRollback: false,
    supportsKillSwitch: true,
    riskLevel: "CRITICAL",
    reason: "No autonomous deployment — snapshots and routing only unless approved.",
  },
  compliance_actions: {
    domain: "compliance_actions",
    allowedModes: ["OFF", "ASSIST", "FULL_AUTOPILOT_APPROVAL"],
    defaultMode: "OFF",
    requiresApproval: true,
    supportsRollback: false,
    supportsKillSwitch: true,
    riskLevel: "CRITICAL",
    reason: "Compliance overrides default blocked unless explicit regulatory approval workflow.",
  },
};

export function listDomainMatrix(): AutopilotDomainMatrixRow[] {
  return Object.values(DOMAIN_MATRIX);
}

export function getDomainMatrixRow(domain: LecipmAutopilotDomainId): AutopilotDomainMatrixRow | undefined {
  return DOMAIN_MATRIX[domain];
}

export function assertKnownDomain(domain: string): domain is LecipmAutopilotDomainId {
  return domain in DOMAIN_MATRIX;
}

export function normalizePersistedMode(mode: string): FullAutopilotMode {
  const allowed = [
    "OFF",
    "ASSIST",
    "SAFE_AUTOPILOT",
    "FULL_AUTOPILOT_APPROVAL",
    "FULL_AUTOPILOT_BOUNDED",
  ] as const;
  return (allowed as readonly string[]).includes(mode) ? (mode as FullAutopilotMode) : "ASSIST";
}
