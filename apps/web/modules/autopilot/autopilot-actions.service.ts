import type { AutopilotActionDescriptor } from "./autopilot.types";

/**
 * Inventory of contemplated autopilot **classes** — not executable registry (see autonomy / growth engines).
 */
export function listCataloguedAutopilotActions(): AutopilotActionDescriptor[] {
  return [
    {
      key: "listing_quality_hints",
      hub: "bnhub_host",
      risk: "low",
      requiresApproval: false,
      notes: "Suggestion cards only — no publish",
    },
    {
      key: "lead_prioritization",
      hub: "lecipm_crm",
      risk: "low",
      requiresApproval: false,
      notes: "Ordering only — messaging human-triggered",
    },
    {
      key: "host_revenue_hints",
      hub: "bnhub_host",
      risk: "medium",
      requiresApproval: true,
      notes: "Hints reference KPIs — apply pricing via existing flows only",
    },
    {
      key: "investor_digest",
      hub: "investor",
      risk: "low",
      requiresApproval: false,
      notes: "Read-only summaries",
    },
    {
      key: "admin_kpi_digest",
      hub: "admin",
      risk: "low",
      requiresApproval: false,
      notes: "Operational counts from analytics service",
    },
  ];
}
