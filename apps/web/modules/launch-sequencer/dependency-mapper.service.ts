import type { LaunchCandidateMarket, LaunchDependency } from "./launch-sequencer.types";
import { buildLaunchCandidateMarkets } from "./launch-input-aggregation.service";
import { launchSequencerLog } from "./launch-sequencer.logger";

function dep(
  key: string,
  type: LaunchDependency["type"],
  title: string,
  severity: LaunchDependency["severity"],
  blocking: boolean,
  rationale: string[],
): LaunchDependency {
  return { key, type, title, severity, blocking, rationale };
}

/**
 * Map rollout dependencies for a market. When only `marketKey` is passed, loads candidates safely.
 * Never throws — returns best-effort dependency list.
 */
export function mapLaunchDependencies(
  marketKey: string,
  candidate?: LaunchCandidateMarket | null,
): LaunchDependency[] {
  try {
    const key = String(marketKey ?? "").trim();
    if (!key) {
      return [
        dep(
          "unknown_market",
          "DATA",
          "Market key missing",
          "high",
          true,
          ["Cannot sequence launch without a stable market identifier."],
        ),
      ];
    }

    let c = candidate ?? null;
    if (!c) {
      const all = buildLaunchCandidateMarkets();
      c = all.find((x) => x.marketKey === key) ?? null;
    }
    if (!c) {
      launchSequencerLog.info("dependencies_mapped", { marketKey: key, count: 1, fallback: true });
      return [
        dep(
          "candidate_missing",
          "DATA",
          "Incomplete expansion registry row",
          "high",
          true,
          [
            `No consolidated candidate profile found for ${key}.`,
            "Defaulting to blocking data dependency — confirm market pack before scheduling.",
          ],
        ),
      ];
    }

    const out: LaunchDependency[] = [];

    const loc = c.localizationReadiness ?? 0;
    if (loc < 50) {
      out.push(
        dep(
          `loc_${key}`,
          "LOCALIZATION",
          "Localization / content layer incomplete",
          loc < 35 ? "high" : "medium",
          loc < 40,
          [
            "Localized workflows, UI strings, or jurisdiction-specific copy appear below conservative threshold.",
            "Do not enable customer-facing automations until localization gates pass.",
          ],
        ),
      );
    }

    const comp = c.complianceReadiness ?? 0;
    if (comp < 55) {
      out.push(
        dep(
          `comp_${key}`,
          "COMPLIANCE",
          "Compliance pack / policy evidence incomplete",
          comp < 40 ? "high" : "medium",
          true,
          [
            "Regulatory and broker-duty surfaces require explicit review — sequencer treats this as a hard gate.",
            "Recommendations remain scenario-based; counsel must clear production behaviors.",
          ],
        ),
      );
    }

    const dataConf = c.dataConfidence ?? 0;
    if (dataConf < 48) {
      out.push(
        dep(
          `data_${key}`,
          "DATA",
          "Low confidence in market telemetry / config",
          "medium",
          false,
          [
            "Sparse or proxy-only inputs — sequencing will penalize upside vs readiness.",
            "Prefer pilot modes until measurement improves.",
          ],
        ),
      );
    }

    const complexity = c.operationalComplexity ?? 0;
    if (complexity > 72) {
      out.push(
        dep(
          `ops_${key}`,
          "POLICY",
          "Elevated operational / regulatory complexity",
          "high",
          false,
          [
            "High complexity suggests staged rollout even if product modules look ready.",
            "External messaging and autonomy should stay restricted until complexity recedes.",
          ],
        ),
      );
    }

    const staff = c.staffingReadiness ?? 0;
    if (staff < 45) {
      out.push(
        dep(
          `staff_${key}`,
          "STAFFING",
          "Broker / ops capacity appears constrained",
          "medium",
          staff < 30,
          [
            "Human-heavy broker assist may be required for safe pilot.",
            "If blocking, defer broad marketing or autonomy features.",
          ],
        ),
      );
    }

    const prod = c.productReadiness ?? 0;
    if (prod < 50) {
      out.push(
        dep(
          `prod_${key}`,
          "PRODUCT",
          "Product surface maturity below limited-launch bar",
          "medium",
          prod < 35,
          [
            "Core product gates (listings, trust, execution) may be incomplete for this market profile.",
            "Feature subset planner will shrink enabled surfaces.",
          ],
        ),
      );
    }

    if (out.length === 0) {
      out.push(
        dep(
          `clear_${key}`,
          "PRODUCT",
          "No automatic hard blockers flagged",
          "low",
          false,
          [
            "Dependency scan found no mandatory blocking rows at current thresholds.",
            "Continue to validate compliance and localization outside this heuristic.",
          ],
        ),
      );
    }

    launchSequencerLog.info("dependencies_mapped", { marketKey: key, count: out.length });
    return out;
  } catch {
    launchSequencerLog.warn("dependencies_mapped_failed", { marketKey });
    return [
      dep(
        "mapper_error",
        "DATA",
        "Dependency mapping unavailable",
        "medium",
        false,
        ["Internal dependency scan failed — treat rollout plan as provisional."],
      ),
    ];
  }
}
