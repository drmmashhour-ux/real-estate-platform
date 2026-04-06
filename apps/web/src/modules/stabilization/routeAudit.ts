import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AuditResult, StabilizationIssue } from "./types";
import { readTextSafe, relWeb } from "./fsUtils";
import { forEachChildEntry } from "./fileScanner";

function collectPages(dir: string, suffix: string, out: string[]): void {
  forEachChildEntry(dir, ({ absPath, name, isDirectory }) => {
    if (isDirectory) {
      if (name === "node_modules" || name.startsWith(".")) return;
      collectPages(absPath, suffix, out);
    } else if (name === suffix) {
      out.push(absPath);
    }
  });
}

export function runRouteAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const app = join(webRoot, "app");
  const roots = [
    { path: join(app, "bnhub"), label: "bnhub" },
    { path: join(app, "stays"), label: "stays" },
    { path: join(app, "admin"), label: "admin" },
    { path: join(app, "api"), label: "api" },
  ];

  const pages: string[] = [];
  const routes: string[] = [];
  for (const r of roots) {
    if (!existsSync(r.path)) {
      issues.push({ severity: "HIGH", code: "ROUTE_ROOT_MISSING", message: `Missing app subtree: ${r.label}`, file: `app/${r.label}` });
      continue;
    }
    collectPages(r.path, "page.tsx", pages);
    collectPages(r.path, "page.ts", pages);
    collectPages(r.path, "route.ts", routes);
    collectPages(r.path, "route.tsx", routes);
  }

  const bnhubListing = join(app, "bnhub", "[id]", "page.tsx");
  const src = readTextSafe(bnhubListing);
  if (src == null) {
    issues.push({ severity: "CRITICAL", code: "BNHUB_LISTING_PAGE", message: "bnhub/[id]/page.tsx missing", file: "app/bnhub/[id]/page.tsx" });
  } else if (!src.includes("bnhub-listing-view") && !src.includes("BnhubListingView")) {
    issues.push({
      severity: "CRITICAL",
      code: "BNHUB_LISTING_VIEW",
      message: "bnhub/[id]/page.tsx should use BnhubListingView / bnhub-listing-view",
      file: "app/bnhub/[id]/page.tsx",
    });
  }

  const stays = join(app, "stays", "[slug]", "page.tsx");
  const staysSrc = readTextSafe(stays);
  if (staysSrc == null) {
    issues.push({ severity: "CRITICAL", code: "STAYS_PAGE", message: "stays/[slug]/page.tsx missing", file: "app/stays/[slug]/page.tsx" });
  } else if (staysSrc.trim().length < 80) {
    issues.push({ severity: "MEDIUM", code: "STAYS_PAGE_THIN", message: "stays/[slug]/page.tsx looks unusually small", file: "app/stays/[slug]/page.tsx" });
  }

  return {
    name: "routeAudit",
    issues,
    stats: {
      pageFiles: pages.length,
      apiRouteFiles: routes.length,
    },
  };
}
