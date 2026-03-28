import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, readTextSafe } from "./fsUtils";

const ENV_KEY_RE = /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[["']([A-Z_][A-Z0-9_]*)["']])/g;

function extractEnvKeysFromFile(path: string, content: string): Set<string> {
  const keys = new Set<string>();
  ENV_KEY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENV_KEY_RE.exec(content)) !== null) {
    const k = m[1] || m[2];
    if (k) keys.add(k);
  }
  return keys;
}

function parseDefinedFlagsInFeatureFlagsTs(webRoot: string): Set<string> {
  const p = join(webRoot, "lib", "trustgraph", "feature-flags.ts");
  const src = readTextSafe(p);
  const keys = new Set<string>();
  if (!src) return keys;
  const re = /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[["']([A-Z_][A-Z0-9_]*)["']])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const k = m[1] || m[2];
    if (k && k.includes("TRUSTGRAPH")) keys.add(k);
  }
  return keys;
}

export function runFeatureFlagAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const definedInCentral = parseDefinedFlagsInFeatureFlagsTs(webRoot);
  const referenced = new Set<string>();
  const trustgraphRefs = new Set<string>();

  const files = walkTsFiles(webRoot).filter((f) => !f.includes("node_modules") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

  for (const file of files) {
    const content = readTextSafe(file);
    if (!content) continue;
    for (const k of extractEnvKeysFromFile(file, content)) {
      referenced.add(k);
      if (k.includes("TRUSTGRAPH") || k.startsWith("AI_") || k.includes("FEATURE") || k.includes("FLAG")) {
        trustgraphRefs.add(k);
      }
    }
  }

  const launchPresetPath = join(webRoot, "lib", "launch-tracking");
  if (existsSync(launchPresetPath)) {
    const launchFiles = walkTsFiles(launchPresetPath);
    for (const f of launchFiles) {
      const t = readTextSafe(f);
      if (!t) continue;
      for (const k of extractEnvKeysFromFile(f, t)) {
        if (k.includes("ENABLED") || k.includes("LAUNCH")) referenced.add(k);
      }
    }
  }

  for (const k of trustgraphRefs) {
    if (k.startsWith("NEXT_PUBLIC_")) continue;
    if (!definedInCentral.has(k) && k.startsWith("TRUSTGRAPH_")) {
      issues.push({
        severity: "LOW",
        code: "FLAG_TRUSTGRAPH_SCATTERED",
        message: `TRUSTGRAPH-related env "${k}" referenced outside central feature-flags scan — verify it maps to getTrustGraphFeatureFlags()`,
        detail: k,
      });
    }
  }

  const suspiciousPairs = [
    ["DEMO_MODE", "NODE_ENV"],
  ];
  for (const [a, b] of suspiciousPairs) {
    if (referenced.has(a) && referenced.has(b)) {
      issues.push({
        severity: "MEDIUM",
        code: "FLAG_ENV_INTERACTION",
        message: `Both ${a} and ${b} appear in codebase — ensure demo vs production guards are consistent`,
      });
    }
  }

  return {
    name: "featureFlagAudit",
    issues: issues.slice(0, 200),
    stats: {
      uniqueEnvKeysReferenced: referenced.size,
      trustgraphRelatedKeys: trustgraphRefs.size,
      trustgraphKeysInCentralFile: definedInCentral.size,
    },
  };
}
