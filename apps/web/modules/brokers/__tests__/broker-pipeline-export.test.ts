import { describe, expect, it } from "vitest";
import {
  buildBrokerExportRows,
  exportProspectsAsCsv,
  exportProspectsAsJson,
} from "@/modules/brokers/broker-pipeline-export";
import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

const sample: BrokerProspect = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test Broker",
  email: "t@example.com",
  stage: "demo",
  createdAt: "2026-04-01T12:00:00.000Z",
  updatedAt: "2026-04-02T12:00:00.000Z",
  notes: ["[2026-04-01T12:00] hi", "note2"],
  lastContactAt: "2026-04-02T14:00:00.000Z",
  firstPurchaseDate: "2026-04-03",
  totalSpent: 99.5,
};

describe("broker-pipeline-export", () => {
  it("buildBrokerExportRows matches expected shape", () => {
    const rows = buildBrokerExportRows([sample]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: sample.id,
      name: "Test Broker",
      email: "t@example.com",
      stage: "demo",
      notesCount: 2,
      lastContactAt: sample.lastContactAt ?? null,
      firstPurchaseDate: "2026-04-03",
      totalSpent: 99.5,
    });
  });

  it("exportProspectsAsJson is parseable JSON array of rows", () => {
    const raw = exportProspectsAsJson([sample]);
    const parsed = JSON.parse(raw) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed[0] as { stage: string }).stage).toBe("demo");
    expect((parsed[0] as { notesCount: number }).notesCount).toBe(2);
  });

  it("exportProspectsAsCsv header lists stage, notesCount, lastContactAt, purchase fields", () => {
    const csv = exportProspectsAsCsv([sample]);
    const header = csv.split("\n")[0] ?? "";
    expect(header).toContain("stage");
    expect(header).toContain("notesCount");
    expect(header).toContain("lastContactAt");
    expect(header).toContain("firstPurchaseDate");
    expect(header).toContain("totalSpent");
  });

  it("exportProspectsAsCsv includes header and escaped fields", () => {
    const tricky: BrokerProspect = {
      ...sample,
      name: 'Name, "quoted"',
      id: sample.id,
    };
    const csv = exportProspectsAsCsv([tricky]);
    expect(csv.split("\n")[0]).toContain("notesCount");
    expect(csv).toContain("Name, \"\"quoted\"\"");
  });
});
