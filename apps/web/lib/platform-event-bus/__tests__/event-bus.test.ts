import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscribe, getConsumersFor } from "../subscriptions";

vi.mock("@/lib/db", () => ({
  prisma: {
    platformEvent: {
      create: vi.fn().mockResolvedValue({
        id: "evt-1",
        eventType: "property_verified",
        sourceModule: "property-identity",
        entityType: "property",
        entityId: "prop-1",
        payload: { score: 90 },
        region: null,
        processingStatus: "pending",
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("../queue", () => ({
  enqueueForDispatch: vi.fn(),
}));

import { publish } from "../publisher";

describe("platform-event-bus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("publisher", () => {
    it("publish returns stored event shape", async () => {
      const event = await publish("property_verified", {
        sourceModule: "property-identity",
        entityType: "property",
        entityId: "prop-1",
        payload: { score: 90 },
      });
      expect(event.id).toBe("evt-1");
      expect(event.eventType).toBe("property_verified");
      expect(event.sourceModule).toBe("property-identity");
      expect(event.payload).toEqual({ score: 90 });
      expect(event.processingStatus).toBe("pending");
    });
  });

  describe("subscriptions", () => {
    it("subscribe adds consumer for event type", () => {
      const consumer = vi.fn();
      const unsub = subscribe("offer_accepted", consumer);
      expect(getConsumersFor("offer_accepted")).toContain(consumer);
      unsub();
      expect(getConsumersFor("offer_accepted")).not.toContain(consumer);
    });
  });
});
