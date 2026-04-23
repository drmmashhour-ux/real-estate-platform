import { describe, expect, it } from "vitest";

import { generateContentIdeas } from "./ai-content-ideas.service";
import { generateShortFormScript, scriptToPlainText } from "./ai-content-script.service";
import { generateCaptionPack, packToSocialText } from "./ai-content-caption.service";
import { generateDailyContentPlan } from "./ai-content-daily.service";

describe("ai-content-ideas.service", () => {
  it("generates city-specific titles", () => {
    const ideas = generateContentIdeas("Montreal", 3);
    expect(ideas).toHaveLength(3);
    expect(ideas[0]!.title).toMatch(/Montreal/i);
    expect(ideas.every((i) => i.id.startsWith("idea_"))).toBe(true);
  });
});

describe("ai-content-script.service", () => {
  it("produces hook, body, CTA", () => {
    const [idea] = generateContentIdeas("Laval", 1);
    const s = generateShortFormScript(idea, "TIKTOK");
    const text = scriptToPlainText(s);
    expect(s.hook.length).toBeGreaterThan(3);
    expect(s.body.length).toBeGreaterThan(20);
    expect(s.cta.length).toBeGreaterThan(5);
    expect(text).toContain(s.hook);
    expect(s.targetSeconds).toBeGreaterThan(10);
  });
});

describe("ai-content-caption.service", () => {
  it("returns caption and hashtags", () => {
    const [idea] = generateContentIdeas("Quebec", 1);
    const script = generateShortFormScript(idea, "INSTAGRAM");
    const pack = generateCaptionPack(idea, "INSTAGRAM", script);
    const full = packToSocialText(pack);
    expect(pack.hashtags.length).toBeGreaterThan(2);
    expect(pack.hashtags[0]!.startsWith("#")).toBe(true);
    expect(full).toContain(pack.ctaLine);
  });
});

describe("ai-content-daily.service", () => {
  it("builds 1–3 platform-mixed posts", () => {
    const plan = generateDailyContentPlan({ city: "Montréal", postsPerDay: 3, anchorDate: new Date("2026-01-15") });
    expect(plan.posts.length).toBeGreaterThanOrEqual(1);
    expect(plan.posts.length).toBeLessThanOrEqual(3);
    expect(plan.posts[0]!.script.hook).toBeTruthy();
    expect(new Set(plan.posts.map((p) => p.platform)).size).toBeGreaterThan(0);
  });
});
