import { afterEach, describe, expect, it } from "vitest";
import { evaluateCrossDomainTransfer } from "./cross-domain-policy";

describe("evaluateCrossDomainTransfer", () => {
  const prev = process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH;
    } else {
      process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH = prev;
    }
  });

  it("allowlists DREAM_HOME → LISTINGS with rationale", () => {
    const g = evaluateCrossDomainTransfer("DREAM_HOME", "LISTINGS");
    expect(g.allowed).toBe(true);
    expect(g.rationale.toLowerCase()).toContain("dream home");
  });

  it("blocks LEADS → GROWTH by default", () => {
    delete process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH;
    const g = evaluateCrossDomainTransfer("LEADS", "GROWTH");
    expect(g.allowed).toBe(false);
    expect(g.rationale).toMatch(/blocked|default/i);
  });

  it("allows LEADS → GROWTH when env approved", () => {
    process.env.PLAYBOOK_CROSS_DOMAIN_LEADS_TO_GROWTH = "true";
    const g = evaluateCrossDomainTransfer("LEADS", "GROWTH");
    expect(g.allowed).toBe(true);
  });

  it("blocks unknown pairs", () => {
    const g = evaluateCrossDomainTransfer("LISTINGS", "GROWTH");
    expect(g.allowed).toBe(false);
  });
});
