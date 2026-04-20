import type { AutopilotModeDescriptor, AutopilotStage } from "./autopilot.types";

/**
 * Effective roadmap stage — env-driven so ops can align with docs without redeploying copy.
 */
export function getEffectiveAutopilotStage(): AutopilotStage {
  const raw = process.env.FEATURE_LECIPM_AUTOMATION_STAGE?.trim();
  if (raw === "2" || raw === "3" || raw === "4") return raw;
  return "1";
}

export function describeDefaultModes(): AutopilotModeDescriptor[] {
  const stage = getEffectiveAutopilotStage();
  return [
    {
      hub: "lecipm_crm",
      stage,
      label: "CRM assist",
      disclaimer:
        stage === "1"
          ? "Recommendations and ranked leads only — no outbound automation."
          : "Drafts may appear; sends remain approval-gated unless template-approved.",
    },
    {
      hub: "bnhub_host",
      stage,
      label: "BNHub host assist",
      disclaimer:
        "Night-rate execution follows pricing mode and BNHub autonomy policy — never bypassed here.",
    },
    {
      hub: "investor",
      stage,
      label: "Investor insights",
      disclaimer: "Summaries are informational — no trading or capital movement.",
    },
    {
      hub: "admin",
      stage,
      label: "Admin intelligence",
      disclaimer: "Aggregated KPI digest — destructive actions remain manual workflows.",
    },
  ];
}
