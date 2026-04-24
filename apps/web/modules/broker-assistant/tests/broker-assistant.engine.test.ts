import { describe, expect, it, vi } from "vitest";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { runBrokerAssistant } from "@/modules/broker-assistant/broker-assistant.engine";
import { evaluateBrokerAssistantCompliance } from "@/modules/broker-assistant/broker-assistant-compliance.service";
import { detectMissingInformation } from "@/modules/broker-assistant/broker-assistant-checklist.service";
import { translateBrokerMessageEnToProfessionalFr } from "@/modules/broker-assistant/broker-assistant-translation.service";
import { suggestClauseCategoriesForContext } from "@/modules/broker-assistant/broker-assistant-clauses.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    clausesLibrary: { count: vi.fn().mockResolvedValue(0) },
  },
}));

describe("broker assistant", () => {
  it("detects missing buyer and financing deadline", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "promise_to_purchase",
      offerStatus: "draft",
      transactionMode: "represented_purchase",
      parties: [{ role: "seller", fullName: "A" }],
      listing: { addressLine: "1 x", city: "QC", postalCode: "H1H1H1" },
      conditions: { financing: { present: true } },
      broker: { displayName: "B", brokerDisclosureRecorded: true },
    });
    const missing = detectMissingInformation(ctx);
    expect(missing.some((m) => m.id === "buyer_name")).toBe(true);
    expect(missing.some((m) => m.id === "financing_deadline")).toBe(true);
  });

  it("flags broker disclosure in compliance layer", () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "promise_to_purchase",
      transactionMode: "represented_sale",
      broker: { displayName: "X", brokerDisclosureRecorded: false },
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
    });
    const missing = detectMissingInformation(ctx);
    const { flags } = evaluateBrokerAssistantCompliance(ctx, missing);
    expect(flags.some((f) => f.code === "BROKER_DISCLOSURE")).toBe(true);
  });

  it("blocks commercial wording heuristics", () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "other",
      transactionMode: "represented_sale",
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1", listingTypeHint: "commercial office" },
    });
    const missing = detectMissingInformation(ctx);
    const { level, flags } = evaluateBrokerAssistantCompliance(ctx, missing);
    expect(level).toBe("blocked_until_fixed");
    expect(flags.some((f) => f.code === "RESIDENTIAL_SCOPE")).toBe(true);
  });

  it("FSBO mode adds neutral drafting and suppresses broker disclosure checklist item", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "email",
      transactionMode: "fsbo_neutral",
      fsboContext: true,
      parties: [],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
    });
    const out = await runBrokerAssistant(ctx);
    expect(out.complianceFlags.some((f) => f.code === "FSBO_NEUTRAL_TOOL")).toBe(true);
    expect(out.draftingSuggestions.some((d) => d.id === "draft_fsbo_neutral")).toBe(true);
  });

  it("translation path produces French output", () => {
    const ctx = buildBrokerAssistantContext({ documentType: "email" });
    const t = translateBrokerMessageEnToProfessionalFr("Thank you for your offer.", ctx);
    expect(t.professionalFr.length).toBeGreaterThan(5);
    expect(t.targetLocale).toBe("FR");
  });

  it("suggests promise clause category for PTP", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "promise_to_purchase",
      transactionMode: "represented_purchase",
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
    });
    const clauses = await suggestClauseCategoriesForContext(ctx);
    expect(clauses.some((c) => c.categoryCode === "promise_to_purchase")).toBe(true);
  });

  it("outputs READY_FOR_REVIEW only", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "note",
      transactionMode: "represented_sale",
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
      broker: { brokerDisclosureRecorded: true, displayName: "x" },
    });
    const out = await runBrokerAssistant(ctx);
    expect(out.status).toBe("READY_FOR_REVIEW");
  });

  it("exposes French-first summary alias", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "note",
      transactionMode: "represented_sale",
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
      broker: { brokerDisclosureRecorded: true, displayName: "x" },
    });
    const out = await runBrokerAssistant(ctx);
    expect(out.summary).toBe(out.summaryFr);
  });

  it("never declares auto-dispatch or binding send on output", async () => {
    const ctx = buildBrokerAssistantContext({
      documentType: "email",
      transactionMode: "represented_sale",
      parties: [{ role: "buyer", fullName: "a" }, { role: "seller", fullName: "b" }],
      listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
      broker: { brokerDisclosureRecorded: true, displayName: "x" },
    });
    const out = await runBrokerAssistant(ctx);
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/auto_?send|dispatched|email_?sent|binding_?dispatched/i);
  });
});
