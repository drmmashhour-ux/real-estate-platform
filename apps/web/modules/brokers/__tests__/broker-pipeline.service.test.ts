import { afterEach, describe, expect, it } from "vitest";
import {
  __resetBrokerPipelineStoreForTests,
  addBrokerNote,
  buildBrokerPipelineSummary,
  createBrokerProspect,
  getBrokerPipelinePersistenceMeta,
  listBrokerPipeline,
  markBrokerPurchaseOnProspect,
  updateBrokerStage,
} from "@/modules/brokers/broker-pipeline.service";
import { getBrokerMonitoringSnapshot, resetBrokerMonitoringForTests } from "@/modules/brokers/broker-monitoring.service";

describe("broker-pipeline.service", () => {
  afterEach(() => {
    __resetBrokerPipelineStoreForTests();
    resetBrokerMonitoringForTests();
  });

  it("creates a prospect and lists pipeline newest-first", () => {
    const p = createBrokerProspect({
      name: "Alex Broker",
      email: "alex@example.com",
      source: "linkedin",
    });
    expect(p.id).toBeTruthy();
    expect(p.stage).toBe("new");
    expect(p.notes === undefined || Array.isArray(p.notes)).toBe(true);
    const list = listBrokerPipeline();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("Alex Broker");
  });

  it("updates stage and appends notes as array entries", () => {
    const p = createBrokerProspect({ name: "Jamie", phone: "+15145550199" });
    const moved = updateBrokerStage(p.id, "contacted");
    expect(moved?.stage).toBe("contacted");
    const noted = addBrokerNote(p.id, "Called — interested in demo");
    expect(noted?.notes?.some((n) => n.includes("Called — interested in demo"))).toBe(true);
  });

  it("buildBrokerPipelineSummary counts stages", () => {
    createBrokerProspect({ name: "A", email: "a@x.com" });
    const b = createBrokerProspect({ name: "B", email: "b@x.com" });
    updateBrokerStage(b.id, "converted");
    const s = buildBrokerPipelineSummary();
    expect(s.total).toBe(2);
    expect(s.byStage.new).toBe(1);
    expect(s.byStage.converted).toBe(1);
    expect(s.conversionRate).toBe(50);
  });

  it("does not mutate create input", () => {
    const input = { name: "Z", notes: ["n1"] as string[] };
    const copy = { ...input, notes: [...input.notes] };
    createBrokerProspect(input);
    expect(input).toEqual(copy);
  });

  it("markBrokerPurchaseOnProspect does not double-count conversion monitoring", () => {
    const p = createBrokerProspect({ name: "Dup", email: "dup@x.com" });
    markBrokerPurchaseOnProspect(p.id, { firstPurchaseDate: "2026-01-01", moveToConverted: true });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
    markBrokerPurchaseOnProspect(p.id, { firstPurchaseDate: "2026-02-01", moveToConverted: true });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
  });

  it("markBrokerPurchase after manual convert does not increment conversion again", () => {
    const p = createBrokerProspect({ name: "StageFirst", email: "sf@x.com" });
    updateBrokerStage(p.id, "converted");
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
    markBrokerPurchaseOnProspect(p.id, { firstPurchaseDate: "2026-03-01", moveToConverted: true });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
  });

  it("updateBrokerStage to converted does not increment conversion monitoring if purchase already attributed", () => {
    const p = createBrokerProspect({ name: "PurchasedFirst", email: "pf@x.com" });
    markBrokerPurchaseOnProspect(p.id, { firstPurchaseDate: "2026-02-15", moveToConverted: false });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(0);
    updateBrokerStage(p.id, "converted");
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(0);
  });

  it("getBrokerPipelinePersistenceMeta reflects BROKER_PIPELINE_JSON_PATH", () => {
    const prev = process.env.BROKER_PIPELINE_JSON_PATH;
    delete process.env.BROKER_PIPELINE_JSON_PATH;
    expect(getBrokerPipelinePersistenceMeta().persistenceMode).toBe("memory");
    expect(getBrokerPipelinePersistenceMeta().jsonPathConfigured).toBe(false);
    process.env.BROKER_PIPELINE_JSON_PATH = "/tmp/broker-pipeline-test.json";
    expect(getBrokerPipelinePersistenceMeta().persistenceMode).toBe("json_file");
    expect(getBrokerPipelinePersistenceMeta().jsonPathConfigured).toBe(true);
    if (prev === undefined) delete process.env.BROKER_PIPELINE_JSON_PATH;
    else process.env.BROKER_PIPELINE_JSON_PATH = prev;
  });
});
