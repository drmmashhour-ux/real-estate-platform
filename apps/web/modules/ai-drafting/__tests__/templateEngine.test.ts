import { describe, expect, it } from "vitest";
import { getDraftTemplateById, generateDraftDocument } from "@/src/modules/ai-drafting/templates/templateEngine";

describe("templateEngine", () => {
  it("fills known variables deterministically", () => {
    const tpl = getDraftTemplateById("lease_notice_v1");
    expect(tpl).toBeTruthy();
    const doc = generateDraftDocument(tpl!, {
      landlord_name: "ACME",
      tenant_name: "John",
      property_address: "123 Main",
      notice_date: "2026-03-26",
      effective_date: "2026-04-01",
      clause_reference: "Clause 8.1",
    });
    expect(doc.content).toContain("ACME");
    expect(doc.content).toContain("Clause 8.1");
  });
});
