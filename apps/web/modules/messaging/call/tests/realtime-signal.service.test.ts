import { describe, expect, it } from "vitest";
import { analyzeRealtimeSignals } from "../realtime-signal.service";

describe("analyzeRealtimeSignals", () => {
  it("counts silences and interruptions", () => {
    const r = analyzeRealtimeSignals({
      startedAt: new Date().toISOString(),
      events: [
        { timestamp: new Date().toISOString(), type: "silence" },
        { timestamp: new Date().toISOString(), type: "long_pause" },
        { timestamp: new Date().toISOString(), type: "interruption" },
      ],
    });
    expect(r.longSilences).toBe(2);
    expect(r.interruptions).toBe(1);
  });

  it("infers speaking balance from speech segments", () => {
    const r = analyzeRealtimeSignals({
      startedAt: new Date().toISOString(),
      events: [
        { timestamp: new Date().toISOString(), type: "speech_segment", speaker: "client" },
        { timestamp: new Date().toISOString(), type: "speech_segment", speaker: "client" },
        { timestamp: new Date().toISOString(), type: "speech_segment", speaker: "broker" },
      ],
    });
    expect(r.speakingBalance).toBeDefined();
    expect(r.speakingBalance! > 0).toBe(true);
  });
});
