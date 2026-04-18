import { securityHardeningV1Flags } from "@/config/feature-flags";

const SQLISH = /(\b(union|select|insert|update|delete|drop|alter|exec|script)\b)|(--)|(\/\*)|(\bor\b\s+\d+\s*=\s*\d+)/i;
const XSSISH = /<script|javascript:|on\w+\s*=|<iframe|data:text\/html/i;

/** Fast string screen — use before DB / echo; not a substitute for parameterized queries. */
export function looksLikeSqlInjection(input: string): boolean {
  if (!securityHardeningV1Flags.inputValidationV1) return false;
  return SQLISH.test(input);
}

export function looksLikeXss(input: string): boolean {
  if (!securityHardeningV1Flags.inputValidationV1) return false;
  return XSSISH.test(input);
}

export function sanitizePlainString(input: string, maxLen: number): string {
  return input.trim().slice(0, maxLen).replace(/\0/g, "");
}

/** Shallow object walk for logging / pre-validation. */
export function scanUnknownJsonForPatterns(value: unknown, path = ""): string[] {
  if (!securityHardeningV1Flags.inputValidationV1) return [];
  const issues: string[] = [];
  if (typeof value === "string") {
    if (looksLikeSqlInjection(value)) issues.push(`${path}:sql_pattern`);
    if (looksLikeXss(value)) issues.push(`${path}:xss_pattern`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => issues.push(...scanUnknownJsonForPatterns(v, `${path}[${i}]`)));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      issues.push(...scanUnknownJsonForPatterns(v, path ? `${path}.${k}` : k));
    }
  }
  return issues;
}
