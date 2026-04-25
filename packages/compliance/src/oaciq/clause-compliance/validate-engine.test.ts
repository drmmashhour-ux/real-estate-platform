import { describe, expect, it } from "vitest";
import {
  validateClauseBatchSync,
  validateLegacyClauseStrings,
} from "@/lib/compliance/oaciq/clause-compliance/validate-engine";

describe("validateClauseBatchSync", () => {
  it("blocks missing params", () => {
    const r = validateClauseBatchSync([
      {
        clauseId: "promise_earnest_money",
        params: { action: "deposit", actor: "buyer" },
      },
    ]);
    expect(r.valid).toBe(false);
    expect(r.blockSubmission).toBe(true);
    expect(r.issues.some((i) => i.code === "MISSING_PARAM")).toBe(true);
  });

  it("passes complete structured clause", () => {
    const r = validateClauseBatchSync([
      {
        clauseId: "promise_inspection_condition",
        params: {
          action: "obtain inspection report",
          actor: "buyer",
          deadline: "2026-05-01",
          notice: "written notice to seller broker",
          consequence: "promise null and void",
        },
        narrativeFr: "L'acheteur doit faire inspecter avant le 1er mai 2026.",
      },
    ]);
    expect(r.valid).toBe(true);
    expect(r.blockSubmission).toBe(false);
  });

  it("flags ambiguous timing", () => {
    const r = validateClauseBatchSync([
      {
        clauseId: "brokerage_termination_notice",
        params: {
          action: "terminate",
          actor: "broker",
          deadline: "as soon as possible",
          notice: "email",
          consequence: "contract ends",
        },
      },
    ]);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "AMBIGUOUS_LANGUAGE")).toBe(true);
  });

  it("emits enforcement for off-market amendment", () => {
    const r = validateClauseBatchSync([
      {
        clauseId: "amendment_off_market",
        params: {
          action: "withdraw from MLS",
          actor: "seller",
          deadline: "2026-04-30",
          notice: "to syndicate",
          consequence: "mandate continues off-market",
        },
      },
    ]);
    expect(r.valid).toBe(true);
    expect(r.enforcement.some((e) => e.kind === "off_market_listing")).toBe(true);
    expect(r.enforcement.some((e) => e.kind === "trust_account_workflow")).toBe(false);
  });

  it("emits trust workflow for security deposit clause", () => {
    const r = validateClauseBatchSync([
      {
        clauseId: "other_security_deposit_trust",
        params: {
          action: "hold $5000",
          actor: "listing broker trust account",
          deadline: "closing",
          notice: "joint instructions",
          consequence: "disburse per agreement",
        },
      },
    ]);
    expect(r.enforcement.some((e) => e.kind === "trust_account_workflow")).toBe(true);
  });
});

describe("validateLegacyClauseStrings", () => {
  it("blocks asap in free text", () => {
    const r = validateLegacyClauseStrings(["The buyer must close as soon as possible."]);
    expect(r.valid).toBe(false);
  });
});
