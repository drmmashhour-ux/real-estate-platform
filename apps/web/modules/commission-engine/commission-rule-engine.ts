import type { CommissionRuleConfigV1 } from "./commission-engine.types";
import { applySplitRuleV1 } from "./split-rule.service";

export function parseRuleConfig(raw: unknown): CommissionRuleConfigV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const officeSharePercent = Number(o.officeSharePercent);
  const brokerShareOfRemainderPercent = Number(o.brokerShareOfRemainderPercent);
  if (!Number.isFinite(officeSharePercent) || !Number.isFinite(brokerShareOfRemainderPercent)) return null;
  return {
    version: 1,
    officeSharePercent,
    brokerShareOfRemainderPercent,
    deductions: Array.isArray(o.deductions) ? (o.deductions as CommissionRuleConfigV1["deductions"]) : [],
  };
}

export function runCommissionRuleEngine(grossCents: number, ruleConfig: unknown) {
  const rule = parseRuleConfig(ruleConfig);
  if (!rule) {
    return {
      ok: false as const,
      error: "Invalid or unsupported commission rule configuration.",
    };
  }
  return { ok: true as const, result: applySplitRuleV1(grossCents, rule) };
}
