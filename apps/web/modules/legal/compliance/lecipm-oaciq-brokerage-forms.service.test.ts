import { describe, expect, it } from "vitest";
import { BrokerageContractStatus, OaciqMandatoryFormVersion } from "@prisma/client";
import {
  buildOaciqBrokerageCheckPayload,
  oaciqBrokerageFormsAllowListingPublish,
  validateOaciqBrokerageListingCompliance,
} from "./lecipm-oaciq-brokerage-forms.service";

describe("validateOaciqBrokerageListingCompliance", () => {
  const baseContract = {
    id: "c1",
    formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
    status: BrokerageContractStatus.active,
    includesDistributionAuthorization: false,
  };
  const baseDeclaration = {
    id: "d1",
    sellerId: "s1",
    formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
    completed: true,
    signed: true,
    refused: false,
  };

  it("fails without contract", () => {
    const r = validateOaciqBrokerageListingCompliance({
      contract: null,
      declaration: baseDeclaration,
      identityVerified: true,
    });
    expect(r).toEqual({ ok: false, code: "NO_CONTRACT" });
  });

  it("fails on refusal", () => {
    const r = validateOaciqBrokerageListingCompliance({
      contract: baseContract,
      declaration: { ...baseDeclaration, refused: true, completed: true },
      identityVerified: true,
    });
    expect(r).toEqual({ ok: false, code: "DECLARATION_REFUSED_BLOCK" });
  });

  it("passes when all core checks satisfied", () => {
    const r = validateOaciqBrokerageListingCompliance({
      contract: baseContract,
      declaration: baseDeclaration,
      identityVerified: true,
    });
    expect(r).toEqual({ ok: true });
  });
});

describe("buildOaciqBrokerageCheckPayload", () => {
  it("requires disclosure for ready_for_transaction", () => {
    const slice = {
      contract: {
        id: "c",
        formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
        status: BrokerageContractStatus.active,
        includesDistributionAuthorization: false,
      },
      declaration: {
        id: "d",
        sellerId: "s",
        formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
        completed: true,
        signed: true,
        refused: false,
      },
      disclosure: { disclosedToBuyer: false },
      identityVerified: true,
    };
    const p = buildOaciqBrokerageCheckPayload(slice);
    expect(p.ready_for_transaction).toBe(false);
    expect(p.disclosure_complete).toBe(false);
  });

  it("allows publish without buyer disclosure", () => {
    const slice = {
      contract: {
        id: "c",
        formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
        status: BrokerageContractStatus.active,
        includesDistributionAuthorization: false,
      },
      declaration: {
        id: "d",
        sellerId: "s",
        formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
        completed: true,
        signed: true,
        refused: false,
      },
      disclosure: null,
      identityVerified: true,
    };
    expect(oaciqBrokerageFormsAllowListingPublish(slice)).toBe(true);
  });
});
