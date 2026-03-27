import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const createMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    growthEmailLog: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/analytics/posthog-server", () => ({
  captureServerEvent: vi.fn(),
}));

describe("sendGrowthPlainEmail", () => {
  it("returns skipped when idempotency key collides (P2002)", async () => {
    const { sendGrowthPlainEmail } = await import("../infrastructure/emailService");
    createMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique", { code: "P2002", clientVersion: "test", meta: {} })
    );
    const r = await sendGrowthPlainEmail({
      userId: "u1",
      to: "a@b.com",
      triggerKey: "inactive_3d_listing",
      idempotencyKey: "dup-key",
      subject: "S",
      body: "B",
    });
    expect(r).toEqual({ ok: true, skipped: true });
  });
});
