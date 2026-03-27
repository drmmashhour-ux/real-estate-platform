import { describe, expect, it } from "vitest";
import { generateDailyDM, regenerateDailyDM } from "../domain/dailyDmScript";

describe("generateDailyDM", () => {
  it("includes broker value props and CTA", () => {
    const { script } = generateDailyDM();
    expect(script).toContain("AI platform");
    expect(script).toContain("brokers");
    expect(script.toLowerCase()).toMatch(/demo|walkthrough/);
  });

  it("regenerate rotates variant", () => {
    const a = generateDailyDM({ variantIndex: 0 });
    const b = regenerateDailyDM(a.variantIndex);
    expect(b.script).not.toBe(a.script);
  });
});
