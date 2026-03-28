import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, readTextSafe, relWeb } from "./fsUtils";

const PRODUCTION_CRITICAL = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "CRON_SECRET",
] as const;

const UNSAFE_DEFAULT_PATTERNS: {
  id: string;
  re: RegExp;
  message: string;
  severity: StabilizationIssue["severity"];
}[] = [
  {
    id: "password_literal",
    re: /password\s*=\s*["'][^"']+["']/i,
    message: "Possible hardcoded password string",
    severity: "HIGH",
  },
  {
    id: "sk_live",
    re: /sk_live_[0-9a-zA-Z]+/,
    message: "Stripe LIVE secret key pattern in source",
    severity: "CRITICAL",
  },
  {
    id: "supabase_service",
    re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'][^"']+["']/,
    message: "Possible hardcoded Supabase service role",
    severity: "CRITICAL",
  },
];

function parseEnvExampleKeys(webRoot: string): string[] {
  const p = join(webRoot, ".env.example");
  if (!existsSync(p)) return [];
  const lines = readFileSync(p, "utf8").split("\n");
  const keys = new Set<string>();
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const m = /^#?\s*([A-Z_][A-Z0-9_]*)\s*=/.exec(t);
    if (m) keys.add(m[1]);
  }
  return [...keys];
}

export function runEnvAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const exampleKeys = new Set(parseEnvExampleKeys(webRoot));

  const dotEnvPath = join(webRoot, ".env");
  const dotEnvKeys = new Set<string>();
  if (existsSync(dotEnvPath)) {
    try {
      for (const line of readFileSync(dotEnvPath, "utf8").split("\n")) {
        const m = /^([A-Z_][A-Z0-9_]*)\s*=/.exec(line.trim());
        if (m && !line.trim().startsWith("#")) dotEnvKeys.add(m[1]);
      }
    } catch {
      /* unreadable .env */
    }
  }

  for (const key of PRODUCTION_CRITICAL) {
    const v = process.env[key];
    const inDotenv = dotEnvKeys.has(key);
    if ((v == null || v === "") && !inDotenv) {
      issues.push({
        severity: "HIGH",
        code: "ENV_MISSING_CHECKLIST",
        message: `Production checklist: ${key} not set in process.env and not listed in apps/web/.env`,
        detail: "Normal for a fresh clone; must be configured before real production traffic.",
      });
    }
  }

  const aiRisk = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"];
  for (const k of aiRisk) {
    if (process.env[k] === "" || process.env[k] === "placeholder") {
      issues.push({
        severity: "MEDIUM",
        code: "ENV_AI_UNSAFE",
        message: `AI key ${k} empty or placeholder-like`,
      });
    }
  }

  const scanFiles = walkTsFiles(webRoot).filter(
    (f) =>
      !f.includes("node_modules") &&
      !f.includes(".stabilization") &&
      !f.endsWith(".test.ts") &&
      !f.endsWith(".test.tsx")
  );

  const passwordDemoAllow = /demo-account-constants|seed-simulation|seed-runner|\/scripts\/|\/prisma\/seed|test-user|system-validation|backup-db/i;

  let secretHits = 0;
  for (const file of scanFiles) {
    const rel = relWeb(webRoot, file);
    if (rel.includes("run-stabilization") || rel.includes("envAudit")) continue;
    const content = readTextSafe(file);
    if (!content) continue;
    for (const { id, re, message, severity } of UNSAFE_DEFAULT_PATTERNS) {
      if (id === "password_literal" && passwordDemoAllow.test(rel)) continue;
      if (re.test(content)) {
        secretHits += 1;
        issues.push({
          severity,
          code: "HARDCODED_SECRET_PATTERN",
          message,
          file: rel,
        });
        if (issues.filter((i) => i.code === "HARDCODED_SECRET_PATTERN").length >= 40) break;
      }
    }
  }

  const referencedButNotInExample: string[] = [];
  const envUse = /\bprocess\.env\.([A-Z_][A-Z0-9_]*)\b/g;
  for (const file of scanFiles.slice(0, 500)) {
    const content = readTextSafe(file);
    if (!content) continue;
    let m: RegExpExecArray | null;
    envUse.lastIndex = 0;
    while ((m = envUse.exec(content)) !== null) {
      const k = m[1];
      if (k === "NODE_ENV" || k.startsWith("npm_")) continue;
      if (!exampleKeys.has(k) && k.length > 4) {
        if (!referencedButNotInExample.includes(k)) referencedButNotInExample.push(k);
      }
    }
  }

  for (const k of referencedButNotInExample.slice(0, 25)) {
    issues.push({
      severity: "LOW",
      code: "ENV_NOT_IN_EXAMPLE",
      message: `process.env.${k} used but key not documented in .env.example`,
      detail: k,
    });
  }

  return {
    name: "envAudit",
    issues,
    stats: {
      envExampleKeys: exampleKeys.size,
      productionCriticalChecked: PRODUCTION_CRITICAL.length,
      hardcodedPatternFiles: secretHits,
    },
  };
}
