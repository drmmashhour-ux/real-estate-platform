import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailProviderPublish } from "../providers/email-provider";

vi.mock("@/lib/email/resend", () => ({
  isResendConfigured: vi.fn(() => false),
  sendEmail: vi.fn(),
  getFromEmail: vi.fn(() => "Test <test@example.com>"),
}));

vi.mock("../marketing-email-recipients", () => ({
  getMarketingEmailRecipients: vi.fn(() => ["ops@test.com"]),
  isMarketingEmailLiveSendEnabled: vi.fn(() => false),
}));

describe("emailProviderPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dry-run when live send disabled", async () => {
    const r = await emailProviderPublish({
      contentId: "c1",
      bodyText: "Hello",
      emailSubject: "Sub",
      emailBody: "Body",
      emailCta: "Go",
      channel: "EMAIL",
      publishTargetId: null,
      contentType: "EMAIL",
      allowLive: true,
    });
    expect(r.ok).toBe(true);
    expect(r.executedDryRun).toBe(true);
    expect(r.summary).toContain("Dry-run");
  });
});
