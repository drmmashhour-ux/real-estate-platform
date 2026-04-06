import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/ai/openai", () => ({
  isOpenAiConfigured: () => false,
  openai: {},
}));

import { generateSocialPost } from "../generate-social-post";
import { generateCaption } from "../generate-caption";
import { generateEmail } from "../generate-email";
import { generateGrowthIdeas } from "../generate-growth-ideas";

describe("ai-marketing generators (fallback, no API key)", () => {
  it("generateSocialPost returns text without crashing on empty-ish input", async () => {
    const r = await generateSocialPost({
      topic: "",
      platform: "",
      tone: "",
      audience: "",
    });
    expect(r.source).toBe("fallback");
    expect(r.text.length).toBeGreaterThan(20);
  });

  it("generateCaption returns short text", async () => {
    const r = await generateCaption({
      topic: "weekend in Lisbon",
      platform: "TikTok",
      tone: "viral",
      audience: "gen Z travelers",
    });
    expect(r.source).toBe("fallback");
    expect(r.text).toContain("Lisbon");
  });

  it("generateEmail returns subject, body, cta for partnership", async () => {
    const r = await generateEmail({
      topic: "co-marketing",
      tone: "professional",
      audience: "insurance partners",
      emailKind: "partnership",
      partnerType: "regional insurer",
    });
    expect(r.source).toBe("fallback");
    expect(r.subject.length).toBeGreaterThan(3);
    expect(r.body.length).toBeGreaterThan(20);
    expect(r.cta.length).toBeGreaterThan(3);
  });

  it("generateGrowthIdeas returns a list", async () => {
    const r = await generateGrowthIdeas({
      topic: "",
      audience: "",
    });
    expect(r.source).toBe("fallback");
    expect(r.ideas.length).toBeGreaterThanOrEqual(6);
  });
});
