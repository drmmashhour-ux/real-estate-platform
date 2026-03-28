import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import type { AuditResult, StabilizationIssue } from "./types";
import { readTextSafe, relWeb } from "./fsUtils";

function collectApiRoutes(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryName = String(entry.name);
    const absPath = join(dir, entryName);
    if (entry.isDirectory()) collectApiRoutes(absPath, out);
    else if (entryName === "route.ts" || entryName === "route.tsx") out.push(absPath);
  }
}

const CRITICAL_PATH_FRAGMENTS = [
  "stripe/webhook",
  "stripe/checkout",
  "bnhub/bookings",
  "cron",
  "growthAi",
  "immo-contact",
];

export function runApiAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const apiRoot = join(webRoot, "app", "api");
  const routes: string[] = [];
  collectApiRoutes(apiRoot, routes);

  let withTry = 0;
  let withZod = 0;
  let criticalMissingTry = 0;

  for (const file of routes) {
    const rel = relWeb(webRoot, file);
    const content = readTextSafe(file) ?? "";
    const head = content.slice(0, 12_000);
    const hasTry = /\btry\s*\{/.test(head);
    const hasZod = /\.safeParse\s*\(/.test(head) || /\.parse\s*\(/.test(head) && head.includes("zod");
    if (hasTry) withTry += 1;
    if (hasZod) withZod += 1;

    const isCritical = CRITICAL_PATH_FRAGMENTS.some((f) => rel.replace(/\\/g, "/").includes(f));
    if (isCritical && !hasTry && content.length > 200) {
      criticalMissingTry += 1;
      issues.push({
        severity: "MEDIUM",
        code: "API_NO_TRY_CRITICAL",
        message: "Critical API route has no try/catch in first 12k chars — verify error handling",
        file: rel,
      });
    }
  }

  if (routes.length === 0) {
    issues.push({ severity: "CRITICAL", code: "API_NO_ROUTES", message: "No app/api/**/route.ts found" });
  }

  return {
    name: "apiAudit",
    issues: issues.slice(0, 80),
    stats: {
      apiRouteFiles: routes.length,
      routesWithTry: withTry,
      routesWithZodLike: withZod,
    },
  };
}
