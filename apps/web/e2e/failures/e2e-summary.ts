import * as fs from "node:fs";
import * as path from "node:path";
import type { ScenarioResult } from "../scenarios/_context";
import type { E2EFailureRecord } from "./types";

export type LatestRunPayload = {
  generatedAt: string;
  results: ScenarioResult[];
  failures: E2EFailureRecord[];
  launchRecommendation: "safe_to_launch" | "launch_with_caution" | "not_ready";
};

function reportsRoot(): string {
  return path.join(process.cwd(), "e2e", "reports");
}

export function computeLaunchRecommendation(results: ScenarioResult[]): LatestRunPayload["launchRecommendation"] {
  const fail = results.some((r) => r.status === "FAIL");
  const blocked = results.some((r) => r.status === "BLOCKED");
  if (fail) return "not_ready";
  if (blocked) return "launch_with_caution";
  return "safe_to_launch";
}

export function writeLatestRunAndSummary(args: {
  results: ScenarioResult[];
  failureRecords: E2EFailureRecord[];
}): void {
  fs.mkdirSync(reportsRoot(), { recursive: true });
  const launchRecommendation = computeLaunchRecommendation(args.results);
  const payload: LatestRunPayload = {
    generatedAt: new Date().toISOString(),
    results: args.results,
    failures: args.failureRecords,
    launchRecommendation,
  };
  fs.writeFileSync(path.join(reportsRoot(), "latest-run.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = buildSummaryMarkdown(payload);
  fs.writeFileSync(path.join(reportsRoot(), "e2e-summary.md"), md, "utf8");
}

function buildSummaryMarkdown(p: LatestRunPayload): string {
  const byType: Record<string, number> = {};
  for (const f of p.failures) {
    byType[f.type] = (byType[f.type] ?? 0) + 1;
  }

  const lines: string[] = [
    "# E2E run summary",
    "",
    `Generated: ${p.generatedAt}`,
    "",
    "## Scenario results",
    "",
  ];
  for (const r of p.results) {
    lines.push(`- **S${r.id}** ${r.status} — ${r.name}`);
  }
  lines.push("", "## Launch signal", "", `- **${p.launchRecommendation}**`, "");

  if (p.failures.length > 0) {
    lines.push("## Failures by type", "");
    for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${t}: ${n}`);
    }
    lines.push("", "## Critical blockers", "");
    for (const f of p.failures.filter((x) => x.severity === "critical")) {
      lines.push(`- [${f.type}] ${f.context.scenarioSlug}: ${f.likelyRootCause}`);
    }
    if (!p.failures.some((x) => x.severity === "critical")) {
      lines.push("- (none flagged critical)");
    }
    lines.push("", "## Recommended fix order", "");
    lines.push("1. Resolve `infra_blocked` / env / Stripe keys.");
    lines.push("2. Fix `stripe_webhook` / `db_consistency` before payment launches.");
    lines.push("3. Address `market_resolution` / `manual_payment` for Syria.");
    lines.push("4. Triage `rtl_layout` / `missing_translation` for AR/FR.");
    lines.push("", "## Rerun", "", "After fixes: `pnpm test:e2e:launch` or `pnpm test:e2e:scenarios`.", "");
  } else {
    lines.push("## Failures", "", "No failure records captured this run.", "");
  }

  return lines.join("\n");
}
