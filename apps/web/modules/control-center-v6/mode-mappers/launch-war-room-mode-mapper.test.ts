import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "@/modules/control-center-v5/test-fixtures/v4-minimal";
import { mapLaunchWarRoomMode } from "./launch-war-room-mode-mapper";

describe("mapLaunchWarRoomMode", () => {
  it("maps readiness checklist from V4", () => {
    const v4 = minimalV4Payload();
    const p = mapLaunchWarRoomMode(v4, null);
    expect(p.mode).toBe("launch_war_room");
    expect(typeof p.readinessChecklist.noBlockedRollouts).toBe("boolean");
    expect(p.goNoGoSignals.length).toBeGreaterThan(0);
  });
});
