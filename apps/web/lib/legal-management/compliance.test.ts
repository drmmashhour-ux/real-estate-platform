import { describe, expect, it } from "vitest";
import {
  allRequiredCorporateDocsSigned,
  buildCorporateComplianceRows,
} from "@/lib/legal-management/compliance";

const d = (iso: string) => new Date(iso);

describe("buildCorporateComplianceRows", () => {
  it("flags missing types and uses latest row per type by createdAt", () => {
    const rows = buildCorporateComplianceRows([
      {
        type: "terms",
        status: "draft",
        name: "old",
        createdAt: d("2025-01-01T00:00:00Z"),
      },
      {
        type: "terms",
        status: "signed",
        name: "new",
        createdAt: d("2026-01-01T00:00:00Z"),
      },
    ]);
    const terms = rows.find((r) => r.type === "terms");
    expect(terms?.signed).toBe(true);
    expect(terms?.latestName).toBe("new");
    const privacy = rows.find((r) => r.type === "privacy_policy");
    expect(privacy?.tracked).toBe(false);
  });

  it("allRequiredCorporateDocsSigned is true only when every type tracked and signed", () => {
    const ok = buildCorporateComplianceRows(
      ["shareholder_agreement", "privacy_policy", "terms"].map((type, i) => ({
        type,
        status: "signed",
        name: `n${i}`,
        createdAt: d(`2026-03-0${i + 1}T00:00:00Z`),
      })),
    );
    expect(allRequiredCorporateDocsSigned(ok)).toBe(true);

    const missing = buildCorporateComplianceRows([]);
    expect(allRequiredCorporateDocsSigned(missing)).toBe(false);
  });
});
