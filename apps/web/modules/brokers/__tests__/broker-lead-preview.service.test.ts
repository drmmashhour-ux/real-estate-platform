import { describe, expect, it } from "vitest";
import { buildBrokerLeadPreview } from "@/modules/brokers/broker-lead-preview.service";

describe("buildBrokerLeadPreview", () => {
  it("returns masked samples without emails or phone numbers", () => {
    const out = buildBrokerLeadPreview();
    expect(out.items.length).toBeGreaterThan(0);
    const joined = JSON.stringify(out);
    expect(joined).not.toMatch(/@|\+1\d{10}|mailto:/);
    expect(out.disclaimer.length).toBeGreaterThan(10);
  });
});
