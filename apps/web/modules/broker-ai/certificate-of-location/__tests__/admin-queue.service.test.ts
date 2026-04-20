import { describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    legalAlert: {
      findFirst,
      create,
      findMany,
    },
  },
}));

describe("certificate admin queue", () => {
  it("enqueue is no-duplicate when OPEN row exists", async () => {
    findFirst.mockResolvedValueOnce({ id: "existing" });
    const { enqueueCertificateReview } = await import("../certificate-of-location-admin-queue.service");
    const id = await enqueueCertificateReview({ listingId: "l1", reason: "test" });
    expect(id).toBe("existing");
    expect(create).not.toHaveBeenCalled();
  });

  it("getPendingCertificateReviews returns array on failure shape", async () => {
    findMany.mockRejectedValueOnce(new Error("db"));
    const { getPendingCertificateReviews } = await import("../certificate-of-location-admin-queue.service");
    const rows = await getPendingCertificateReviews();
    expect(Array.isArray(rows)).toBe(true);
  });
});
