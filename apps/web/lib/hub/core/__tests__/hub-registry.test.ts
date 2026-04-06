import { describe, it, expect } from "vitest";
import {
  getHubConfig,
  listEnabledHubs,
  listRegisteredHubKeys,
  resolveHubFeatures,
  resolveHubFromRoute,
  resolveHubTheme,
} from "../hub-registry";

describe("LECIPM Hub Engine registry", () => {
  it("registers BNHub as enabled flagship", () => {
    const bn = getHubConfig("bnhub");
    expect(bn).toBeDefined();
    expect(bn?.status).toBe("enabled");
    expect(bn?.bookingMode).toBe("overnight_stay");
    expect(bn?.features.booking).toBe(true);
  });

  it("resolveHubFromRoute finds bnhub for public stays paths", () => {
    expect(resolveHubFromRoute("/bnhub/stays")?.key).toBe("bnhub");
    expect(resolveHubFromRoute("/dashboard/bnhub")?.key).toBe("bnhub");
  });

  it("resolveHubFromRoute finds broker hub", () => {
    expect(resolveHubFromRoute("/dashboard/broker/clients")?.key).toBe("broker");
  });

  it("resolveHubTheme returns premium shell", () => {
    const t = resolveHubTheme("bnhub");
    expect(t.bg.toLowerCase()).toContain("0b");
  });

  it("resolveHubFeatures exposes BNHub AI flags", () => {
    const f = resolveHubFeatures("bnhub");
    expect(f?.autopilot).toBe(true);
  });

  it("listRegisteredHubKeys includes core verticals", () => {
    const keys = listRegisteredHubKeys();
    expect(keys).toContain("bnhub");
    expect(keys).toContain("carhub");
    expect(keys).toContain("servicehub");
    expect(keys).toContain("investorhub");
    expect(keys).toContain("broker");
  });

  it("disabled hubs excluded from listEnabledHubs when env off", () => {
    const enabled = listEnabledHubs().map((h) => h.key);
    expect(enabled).toContain("bnhub");
    expect(enabled).toContain("broker");
  });

  it("resolveHubFromRoute matches generic /hub/:key paths", () => {
    expect(resolveHubFromRoute("/hub/carhub")?.key).toBe("carhub");
    expect(resolveHubFromRoute("/hub/servicehub/extra")?.key).toBe("servicehub");
  });
});
