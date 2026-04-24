/**
 * Integration planning — maps external tools to platform modules and internal services.
 * Keeps HTTP and vendors out of @lecipm/api services for decoupling.
 */

import { PLATFORM_MODULES, type PlatformModuleId } from "@lecipm/core";

export type ExternalToolKind = "crm" | "warehouse" | "calendar" | "esign" | "billing" | "other";

export type ExternalToolProfile = {
  id: string;
  name: string;
  kind: ExternalToolKind;
  /** Which first-party modules this tool typically touches. */
  modules: PlatformModuleId[];
  /** Internal service keys from @lecipm/api/internal. */
  services: ("leads" | "deals" | "messaging" | "analytics")[];
};

export type IntegrationPlan = {
  tool: ExternalToolProfile;
  /** Suggested public scopes if the partner only needs read-only sync. */
  suggestedScopes: string[];
  dataFlows: string[];
  prerequisites: string[];
};

const TOOL_PRESETS: ExternalToolProfile[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    kind: "crm",
    modules: ["ai_intelligence", "marketplace"],
    services: ["leads", "deals", "messaging"],
  },
  {
    id: "snowflake",
    name: "Snowflake / warehouse",
    kind: "warehouse",
    modules: ["ai_intelligence", "investor"],
    services: ["analytics"],
  },
  {
    id: "google_cal",
    name: "Google Calendar",
    kind: "calendar",
    modules: ["marketplace", "investor"],
    services: ["deals", "messaging"],
  },
];

/**
 * Build a lightweight integration plan for partner onboarding.
 */
export function planPartnerIntegration(toolId: string): IntegrationPlan | null {
  const tool = TOOL_PRESETS.find((t) => t.id === toolId);
  if (!tool) return null;

  const modules = PLATFORM_MODULES.filter((m) => tool.modules.includes(m.id));

  return {
    tool,
    suggestedScopes: unique([
      ...tool.services.map((s) => (s === "analytics" ? "insights:read" : `${s}:read`)),
      "leads:write",
    ]),
    dataFlows: [
      ...modules.map((m) => `${m.label} ↔ ${tool.name} via internal services: ${tool.services.join(", ")}`),
      "Use public API routes or private workers — avoid coupling vendors directly to UI bundles.",
    ],
    prerequisites: [
      "Issue scoped API keys per environment; rotate on offboarding.",
      "Document field mapping and idempotency for webhooks.",
      "Respect data residency and consent flags for CRM sync.",
    ],
  };
}

export function listIntegrationPresets(): ExternalToolProfile[] {
  return [...TOOL_PRESETS];
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
