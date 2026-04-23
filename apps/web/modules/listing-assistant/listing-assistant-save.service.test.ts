import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveListingAssistantDraftToCrm } from "./listing-assistant-save.service";

const update = vi.fn();
const createVersion = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      update: (...a: unknown[]) => update(...a),
    },
  },
}));

vi.mock("./listing-version.service", () => ({
  recordListingAssistantVersion: (...a: unknown[]) => createVersion(...a),
}));

describe("saveListingAssistantDraftToCrm", () => {
  beforeEach(() => {
    update.mockResolvedValue({});
    createVersion.mockResolvedValue({});
    update.mockClear();
    createVersion.mockClear();
  });

  it("updates listing draft columns and records version", async () => {
    await saveListingAssistantDraftToCrm({
      listingId: "lst_1",
      actorUserId: "u1",
      source: "AI_ASSISTANT",
      content: {
        title: "T",
        description: "D",
        propertyHighlights: [],
        language: "en",
      },
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lst_1" },
        data: expect.objectContaining({
          assistantDraftSource: "AI_ASSISTANT",
        }),
      })
    );
    expect(createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "lst_1",
        phase: "SAVED_DRAFT",
      })
    );
  });
});
