import { describe, it, expect } from "vitest";
import { leadNotificationEmail, immoContactAckEmail } from "./templates";

describe("leadNotificationEmail", () => {
  it("includes listing id and omits empty listing block when no code", () => {
    const { html } = leadNotificationEmail({
      name: "A",
      email: "a@b.co",
      phone: "1",
      message: "Hi",
    });
    expect(html).not.toContain("Listing ID:");
  });

  it("includes listing code and URL when provided", () => {
    const { html } = leadNotificationEmail({
      name: "A",
      email: "a@b.co",
      phone: "1",
      message: "Hi",
      listingCode: "LEC-10001",
      listingUrl: "https://example.com/bnhub/LEC-10001",
    });
    expect(html).toContain("LEC-10001");
    expect(html).toContain("Open listing");
    expect(html).toContain("https://example.com/bnhub/LEC-10001");
  });
});

describe("immoContactAckEmail", () => {
  it("includes broker follow-up line and listing title", () => {
    const { html, subject } = immoContactAckEmail({ name: "Alex", listingTitle: "Loft QC" });
    expect(subject).toContain("received");
    expect(html).toContain("broker will contact you shortly");
    expect(html).toMatch(/Usually within a few minutes/i);
    expect(html).toContain("Loft QC");
  });
});
