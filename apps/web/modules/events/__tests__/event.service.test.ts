import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    eventRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { recordEvent } from "../event.service";

describe("recordEvent", () => {
  beforeEach(() => {
    vi.mocked(prisma.eventRecord.create).mockReset();
    vi.mocked(prisma.eventRecord.findMany).mockReset();
  });

  it("returns ok after insert", async () => {
    vi.mocked(prisma.eventRecord.create).mockResolvedValue({
      id: "e1",
      entityType: "document",
      entityId: "d1",
      eventType: "document_uploaded",
      actorId: "u1",
      actorType: "seller",
      metadata: {},
      createdAt: new Date(),
    });
    const r = await recordEvent({
      entityType: "document",
      entityId: "d1",
      eventType: "document_uploaded",
      actorId: "u1",
      actorType: "seller",
      metadata: { workflowType: "seller_disclosure" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).toBe("e1");
    expect(prisma.eventRecord.create).toHaveBeenCalledTimes(1);
  });

  it("returns error on validation without throwing", async () => {
    const r = await recordEvent({
      entityType: "",
      entityId: "x",
      eventType: "document_uploaded",
      actorType: "seller",
    });
    expect(r.ok).toBe(false);
    expect(prisma.eventRecord.create).not.toHaveBeenCalled();
  });

});
