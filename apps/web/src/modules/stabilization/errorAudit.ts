import { join } from "node:path";
import type { AuditResult, StabilizationIssue } from "./types";
import { readTextSafe, relWeb } from "./fsUtils";
import { forEachChildEntry } from "./fileScanner";

function collectApiRoutes(dir: string, out: string[]): void {
  forEachChildEntry(dir, ({ absPath, name, isDirectory }) => {
    if (isDirectory) collectApiRoutes(absPath, out);
    else if (name === "route.ts" || name === "route.tsx") out.push(absPath);
  });
}

export function runErrorAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const apiRoot = join(webRoot, "app", "api");
  const routes: string[] = [];
  collectApiRoutes(apiRoot, routes);

  let withTry = 0;
  let consoleOnly = 0;

  for (const file of routes) {
    const rel = relWeb(webRoot, file);
    const content = readTextSafe(file) ?? "";
    if (/\btry\s*\{/.test(content)) withTry += 1;
    if (/console\.(error|warn)\(/.test(content) && !/\btry\s*\{/.test(content.slice(0, 2000))) {
      consoleOnly += 1;
      if (consoleOnly <= 15) {
        issues.push({
          severity: "LOW",
          code: "ERROR_CONSOLE_ONLY_TOP",
          message: "Route starts with console logging but no early try/catch — review error handling",
          file: rel,
        });
      }
    }
  }

  const ratio = routes.length ? withTry / routes.length : 0;
  if (ratio < 0.35 && routes.length > 30) {
    issues.push({
      severity: "MEDIUM",
      code: "ERROR_TRY_SPARSE",
      message: `Only ~${Math.round(ratio * 100)}% of API routes contain try/catch — consider consistent wrappers`,
      detail: `${withTry}/${routes.length}`,
    });
  }

  return {
    name: "errorAudit",
    issues,
    stats: {
      apiRoutes: routes.length,
      routesWithTryCatch: withTry,
      tryRatio: Number(ratio.toFixed(2)),
    },
  };
}
