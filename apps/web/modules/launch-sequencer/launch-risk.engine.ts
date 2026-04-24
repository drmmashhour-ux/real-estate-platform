import type { LaunchDependency, LaunchReadinessScore, LaunchRiskProfile } from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

/**
 * Scenario risk profile — not a legal risk assessment. Never throws.
 */
export function computeLaunchRiskProfile(
  marketKey: string,
  readiness: LaunchReadinessScore,
  dependencies: LaunchDependency[],
): LaunchRiskProfile {
  try {
    const risks: LaunchRiskProfile["risks"] = [];

    if (readiness.score < 45) {
      risks.push({
        key: "low_readiness",
        label: "Low composite readiness",
        severity: "high",
        rationale: ["Several dimensions may be immature — execution risk is elevated in this scenario."],
      });
    }

    const comp = dependencies.filter((d) => d.type === "COMPLIANCE" && d.severity === "high");
    if (comp.length) {
      risks.push({
        key: "compliance_ambiguity",
        label: "Compliance ambiguity / pack gaps",
        severity: "high",
        rationale: ["High-severity compliance dependencies — counsel review before any customer promise."],
      });
    }

    const loc = dependencies.filter((d) => d.type === "LOCALIZATION");
    if (loc.some((d) => d.blocking)) {
      risks.push({
        key: "localization_incomplete",
        label: "Localization incompleteness",
        severity: "medium",
        rationale: ["Blocking localization row — UX and workflow parity risk for local brokers."],
      });
    }

    if (dependencies.some((d) => d.type === "STAFFING" && d.blocking)) {
      risks.push({
        key: "staffing_shortfall",
        label: "Staffing / capacity shortfall",
        severity: "medium",
        rationale: ["Broker-assisted coverage may be insufficient for planned scope."],
      });
    }

    if (dependencies.some((d) => d.type === "DATA" && d.severity !== "low")) {
      risks.push({
        key: "weak_market_data",
        label: "Weak or proxy-only market data",
        severity: "medium",
        rationale: ["Low data confidence increases sequencing uncertainty — avoid aggressive rollout."],
      });
    }

    if (dependencies.some((d) => d.type === "POLICY")) {
      risks.push({
        key: "policy_load",
        label: "Policy / operational load",
        severity: "low",
        rationale: ["Operational complexity may slow transferability from incumbent markets."],
      });
    }

    if (risks.length === 0) {
      risks.push({
        key: "residual",
        label: "Residual execution risk",
        severity: "low",
        rationale: ["No high-priority risk buckets auto-flagged — maintain standard governance."],
      });
    }

    const high = risks.filter((r) => r.severity === "high").length;
    const med = risks.filter((r) => r.severity === "medium").length;
    const overallRisk: LaunchRiskProfile["overallRisk"] =
      high >= 2 ? "high" : high === 1 ? "high" : med >= 2 ? "medium" : med === 1 ? "medium" : "low";

    launchSequencerLog.info("launch_risk_computed", { marketKey, overallRisk, count: risks.length });
    return { overallRisk, risks };
  } catch {
    launchSequencerLog.warn("launch_risk_computed_failed", { marketKey });
    return {
      overallRisk: "high",
      risks: [
        {
          key: "unknown",
          label: "Risk scan unavailable",
          severity: "high",
          rationale: ["Fallback high risk until profile computation succeeds."],
        },
      ],
    };
  }
}
