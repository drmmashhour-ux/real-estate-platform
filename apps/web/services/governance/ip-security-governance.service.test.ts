import path from "path";
import { describe, expect, it } from "vitest";
import { getIpSecurityGovernanceSnapshot } from "./ip-security-governance.service";
import { computeGovernanceRisk } from "./ip-security-risk.service";

const REPO = path.resolve(process.cwd(), "..", "..");

describe("ip-security-governance.service", () => {
  it("returns snapshot from real repo docs without mutating filesystem", () => {
    const a = getIpSecurityGovernanceSnapshot({ repoRoot: REPO, appRoot: process.cwd() });
    expect(typeof a.legal.termsOfServicePresent).toBe("boolean");
    expect(a.meta.repoRootUsed).toBe(REPO);
    expect(computeGovernanceRisk(a).riskLevel).toMatch(/low|medium|high/);
  });

  it("falls back safely when doc root is wrong", () => {
    const a = getIpSecurityGovernanceSnapshot({ repoRoot: path.join(process.cwd(), "nonexistent-gov-root"), appRoot: process.cwd() });
    expect(a.legal.termsOfServicePresent).toBe(false);
    expect(a.meta.docsReadable).toBe(false);
  });
});
