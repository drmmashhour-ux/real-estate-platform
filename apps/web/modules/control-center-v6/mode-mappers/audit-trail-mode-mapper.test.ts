import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "@/modules/control-center-v5/test-fixtures/v4-minimal";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import { mapAuditTrailMode } from "./audit-trail-mode-mapper";

describe("mapAuditTrailMode", () => {
  it("degrades when V1 history empty — digest/delta only", () => {
    const v4 = minimalV4Payload();
    const v1: AiControlCenterPayload | null = null;
    const p = mapAuditTrailMode(v4, v1);
    expect(p.mode).toBe("audit_trail");
    expect(p.summary).toContain("unavailable or empty");
    expect(Array.isArray(p.entries)).toBe(true);
  });

  it("does not throw on empty digest and systems", () => {
    const v4 = minimalV4Payload();
    expect(() => mapAuditTrailMode(v4, null)).not.toThrow();
  });
});
