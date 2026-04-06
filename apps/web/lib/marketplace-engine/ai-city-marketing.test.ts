import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getCityAiMarketingCopy } from "@/lib/marketplace-engine/ai-city-marketing";

describe("getCityAiMarketingCopy", () => {
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env.MARKETPLACE_AI_CITY_COPY;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.MARKETPLACE_AI_CITY_COPY;
    else process.env.MARKETPLACE_AI_CITY_COPY = prev;
  });

  it("is disabled by default", async () => {
    delete process.env.MARKETPLACE_AI_CITY_COPY;
    const r = await getCityAiMarketingCopy({
      slug: "montreal",
      intent: "rent",
      city: "Montreal",
      inventoryCount: 3,
    });
    expect(r.enabled).toBe(false);
    expect(r.source).toBe("off");
  });

  it("returns template when flag on and no OpenAI", async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.MARKETPLACE_AI_CITY_COPY = "1";
    const r = await getCityAiMarketingCopy({
      slug: "montreal",
      intent: "rent",
      city: "Montreal",
      inventoryCount: 3,
    });
    expect(r.enabled).toBe(true);
    expect(r.source).toBe("template");
    expect(r.body.length).toBeGreaterThan(20);
  });
});
