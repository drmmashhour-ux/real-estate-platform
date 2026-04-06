import * as fs from "node:fs";
import * as path from "node:path";
import type { E2ESignalSummary } from "./types";

type LatestRunFile = {
  generatedAt?: string;
  results?: Array<{ id: number; status: string }>;
  launchRecommendation?: "safe_to_launch" | "launch_with_caution" | "not_ready";
};

export function readE2ESignal(): E2ESignalSummary {
  const rawPath = path.join(process.cwd(), "e2e", "reports", "latest-run.json");
  if (!fs.existsSync(rawPath)) {
    return {
      lastRunAt: null,
      scenarioPassRate: null,
      failedScenarioCount: 0,
      blockedScenarioCount: 0,
      recommendation: "unknown",
      rawPath,
    };
  }
  try {
    const raw = fs.readFileSync(rawPath, "utf8");
    const j = JSON.parse(raw) as LatestRunFile;
    const results = j.results ?? [];
    const total = results.length;
    const passed = results.filter((r) => r.status === "PASS").length;
    const failedScenarioCount = results.filter((r) => r.status === "FAIL").length;
    const blockedScenarioCount = results.filter((r) => r.status === "BLOCKED").length;
    const scenarioPassRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : null;
    return {
      lastRunAt: j.generatedAt ?? null,
      scenarioPassRate,
      failedScenarioCount,
      blockedScenarioCount,
      recommendation: j.launchRecommendation ?? "unknown",
      rawPath,
    };
  } catch {
    return {
      lastRunAt: null,
      scenarioPassRate: null,
      failedScenarioCount: 0,
      blockedScenarioCount: 0,
      recommendation: "unknown",
      rawPath,
    };
  }
}
