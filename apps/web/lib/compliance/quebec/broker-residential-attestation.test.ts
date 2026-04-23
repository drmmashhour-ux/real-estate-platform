import { describe, expect, it } from "vitest";
import {
  RESIDENTIAL_BROKER_TITLE_FR,
  formatResidentialBrokerSignatureBlock,
  scanResidentialScopeViolations,
} from "@/lib/compliance/quebec/broker-residential-attestation";

describe("broker-residential-attestation", () => {
  it("signature block includes residential title and OACIQ line", () => {
    const { french } = formatResidentialBrokerSignatureBlock({
      displayName: "Test Broker",
      licenceNumber: "J1321",
      licenceType: "residential",
    });
    expect(french).toContain("Test Broker");
    expect(french).toContain(RESIDENTIAL_BROKER_TITLE_FR);
    expect(french).toContain("OACIQ : J1321");
  });

  it("scanResidentialScopeViolations finds commercial leak", () => {
    expect(scanResidentialScopeViolations("courtier immobilier commercial").length).toBeGreaterThan(0);
  });
});
