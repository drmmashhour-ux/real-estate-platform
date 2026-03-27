import { describe, it, expect } from "vitest";
import { generateAvatarScript } from "@/src/modules/ai-avatar/application/generateAvatarScript";

describe("generateAvatarScript", () => {
  it("returns lines and fullText per context", () => {
    const sim = generateAvatarScript("simulator");
    expect(sim.context).toBe("simulator");
    expect(sim.lines.length).toBeGreaterThan(0);
    expect(sim.fullText).toContain(sim.lines[0]!);
    expect(sim.disclaimer.toLowerCase()).toContain("ai");
  });
});
