import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { buildDraftCertificatePayload } from "@/modules/certificates/lib/build-draft-certificate";
import { enforceProvisionalConditionCertificate } from "@/modules/certificates/lib/enforce-provisional-condition";
import {
  IMMOVABLE_CERTIFICATE_DISCLAIMER_EN,
  IMMOVABLE_CERTIFICATE_DISCLAIMER_FR,
} from "@/modules/certificates/lib/disclaimer";
import { buildCertificateHTML } from "@/modules/certificates/pdf/certificate-builder";
import { sendCertificateEmail } from "@/modules/certificates/services/certificate-email.service";
import type { ImmovableCertificate } from "@/modules/certificates/types/immovable-certificate.types";

describe("certificate module acceptance", () => {
  const originalLog = console.log;

  beforeEach(() => {
    console.log = vi.fn();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("draft payload never auto-confirms GOOD without sources (provisional AVERAGE)", () => {
    const cert = buildDraftCertificatePayload({
      syndicateName: "Test Syndicate",
      buildingAddress: "123 St",
    });
    expect(cert.condition.level).toBe("AVERAGE");
    expect(cert.conclusion.needsWork).toBe(true);
    expect(cert.condition.notes).toMatch(/provisional/i);
    expect(cert.id).toBeTruthy();
    expect(cert.syndicateName).toBe("Test Syndicate");
  });

  it("stored object satisfies ImmovableCertificate shape", () => {
    const cert = buildDraftCertificatePayload({
      syndicateName: "S",
      buildingAddress: "A",
    });
    const keys: (keyof ImmovableCertificate)[] = [
      "id",
      "syndicateName",
      "buildingAddress",
      "date",
      "source",
      "reportIncluded",
      "condition",
      "workHorizon",
      "financial",
      "conclusion",
      "verification",
      "createdAt",
    ];
    for (const k of keys) {
      expect(cert).toHaveProperty(k);
    }
  });

  it("PDF HTML includes bilingual disclaimer and logs [certificate:pdf]", () => {
    const cert = buildDraftCertificatePayload({ syndicateName: "X", buildingAddress: "Y" });
    const html = buildCertificateHTML(cert);
    expect(html).toContain(IMMOVABLE_CERTIFICATE_DISCLAIMER_EN);
    expect(html).toContain(IMMOVABLE_CERTIFICATE_DISCLAIMER_FR);
    expect(console.log).toHaveBeenCalledWith("[certificate:pdf]", cert.id);
  });

  it("API-side enforcement downgrades GOOD without sources", () => {
    const bad: ImmovableCertificate = {
      ...buildDraftCertificatePayload({ syndicateName: "S", buildingAddress: "B" }),
      condition: {
        level: "GOOD",
        deficiencies: [],
        interventions: [],
      },
    };
    const fixed = enforceProvisionalConditionCertificate(bad);
    expect(fixed.condition.level).toBe("AVERAGE");
    expect(fixed.conclusion.needsWork).toBe(true);
  });

  it("sendCertificateEmail logs [certificate:email]", async () => {
    await sendCertificateEmail("ops@example.com", "https://cdn.example.com/cert.pdf");
    expect(console.log).toHaveBeenCalledWith("[certificate:email]", "ops@example.com", "https://cdn.example.com/cert.pdf");
  });

  it("preserves GOOD when a source flag is set", () => {
    const ok: ImmovableCertificate = {
      ...buildDraftCertificatePayload({ syndicateName: "S", buildingAddress: "B" }),
      reportIncluded: true,
      condition: {
        level: "GOOD",
        deficiencies: [],
        interventions: [],
      },
    };
    const out = enforceProvisionalConditionCertificate(ok);
    expect(out.condition.level).toBe("GOOD");
  });
});
