import { describe, expect, it } from "vitest";
import { buildGrowthPolicyActions, buildGrowthPolicyActionBundle } from "../growth-policy-actions.service";
import {
  buildGrowthPolicyDashboardHref,
  POLICY_DOMAIN_SECTION_HASH,
} from "../growth-policy-navigation";
import { selectTopPolicyAction } from "../growth-policy-top-action.service";
import type { GrowthPolicyResult } from "../growth-policy.types";

const governanceFreeze: GrowthPolicyResult = {
  id: "policy-governance-freeze-status",
  domain: "governance",
  severity: "critical",
  title: "Freeze recommended",
  description: "Governance freeze posture.",
  recommendation: "Review before expanding.",
};

const leadsCritical: GrowthPolicyResult = {
  id: "policy-leads-followup-critical",
  domain: "leads",
  severity: "critical",
  title: "Weak follow-up",
  description: "Queue risk.",
  recommendation: "Fix CRM throughput.",
};

const adsWarning: GrowthPolicyResult = {
  id: "policy-ads-zero-leads",
  domain: "ads",
  severity: "warning",
  title: "No leads",
  description: "Spend without leads.",
  recommendation: "Fix landing.",
};

describe("buildGrowthPolicyActions", () => {
  it("maps deterministically (stable order for same severities)", () => {
    const a = buildGrowthPolicyActions([adsWarning, governanceFreeze]);
    const b = buildGrowthPolicyActions([adsWarning, governanceFreeze]);
    expect(a.map((x) => x.policyId)).toEqual(b.map((x) => x.policyId));
  });

  it("dedupes same domain keeping stricter severity", () => {
    const weakClose: GrowthPolicyResult = {
      id: "policy-broker-weak-close",
      domain: "broker",
      severity: "warning",
      title: "Weak close",
      description: "Low close.",
      recommendation: "Coach.",
    };
    const slowDom: GrowthPolicyResult = {
      id: "policy-broker-slow-dominance",
      domain: "broker",
      severity: "warning",
      title: "Slow brokers",
      description: "Too many slow.",
      recommendation: "Route.",
    };
    const actions = buildGrowthPolicyActions([weakClose, slowDom]);
    expect(actions.filter((x) => x.domain === "broker")).toHaveLength(1);
    expect(actions.find((x) => x.domain === "broker")?.policyId).toBe("policy-broker-weak-close");
  });

  it("caps at 8 actions when every domain appears twice (dedupe keeps stricter)", () => {
    const domains = ["ads", "cro", "leads", "messaging", "content", "pricing", "broker", "governance"] as const;
    const waveA: GrowthPolicyResult[] = domains.map((d) => ({
      id: `p-a-${d}`,
      domain: d,
      severity: "info",
      title: "i",
      description: "d",
      recommendation: "r",
    }));
    const waveB: GrowthPolicyResult[] = domains.map((d) => ({
      id: `p-b-${d}`,
      domain: d,
      severity: "warning",
      title: "w",
      description: "d",
      recommendation: "r",
    }));
    const actions = buildGrowthPolicyActions([...waveA, ...waveB]);
    expect(actions).toHaveLength(8);
    expect(actions.every((a) => a.severity === "warning")).toBe(true);
  });
});

describe("selectTopPolicyAction", () => {
  it("prefers governance critical over other critical when severities tie", () => {
    const actions = buildGrowthPolicyActions([leadsCritical, governanceFreeze]);
    const top = selectTopPolicyAction(actions);
    expect(top?.domain).toBe("governance");
  });

  it("prefers non-governance critical over governance info", () => {
    const govInfo: GrowthPolicyResult = {
      id: "gov-info-hypothetical",
      domain: "governance",
      severity: "info",
      title: "FYI",
      description: "Note",
      recommendation: "Watch",
    };
    const actions = buildGrowthPolicyActions([govInfo, adsWarning]);
    const top = selectTopPolicyAction(actions);
    expect(top?.domain).toBe("ads");
  });
});

describe("safe navigation payloads", () => {
  it("includes trace query params and hash", () => {
    const href = buildGrowthPolicyDashboardHref({
      locale: "en",
      country: "ca",
      domain: "ads",
      policyId: "policy-ads-zero-leads",
      queryMerge: { policyId: "policy-ads-zero-leads" },
    });
    expect(href).toContain("from=growth-policy");
    expect(href).toContain("policyId=policy-ads-zero-leads");
    expect(href).toContain(`#${POLICY_DOMAIN_SECTION_HASH.ads}`);
  });
});

describe("buildGrowthPolicyActionBundle", () => {
  it("includes topAction aligned with selectTopPolicyAction", () => {
    const bundle = buildGrowthPolicyActionBundle([leadsCritical, governanceFreeze]);
    expect(bundle.topAction?.policyId).toBe(selectTopPolicyAction(bundle.actions)?.policyId);
    expect(bundle.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
