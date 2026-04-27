import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();
const mockFindMany = vi.fn();
const mockUserUpdate = vi.fn();
const mockLogCreate = vi.fn();
const sendEmail = vi.fn();
const sendSMS = vi.fn();
const trackEvent = vi.fn();

vi.mock("@/lib/sql", () => ({
  query: (...args: unknown[]) => mockQuery(...(args as [string, unknown[]?])),
}));
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    user: { findMany: mockFindMany, update: mockUserUpdate },
    reengagementMessageLog: { create: mockLogCreate },
  }),
}));
vi.mock("@/lib/notifications/system", () => ({
  sendNotification: vi.fn(),
  sendEmail: (...a: unknown[]) => sendEmail(...a),
  sendSMS: (...a: unknown[]) => sendSMS(...a),
}));
vi.mock("@/src/services/analytics", () => ({
  trackEvent: (...a: unknown[]) => trackEvent(...a),
}));

describe("generateReengagementMessage (Order 58)", () => {
  it("3–5 days inactive uses new-listings copy", async () => {
    const { generateReengagementMessage } = await import("@/lib/retention/messages");
    const m = generateReengagementMessage({
      name: "Alex",
      homeCity: "Montreal",
      daysInactive: 4,
      highIntent: false,
      preferredCity: "Montreal",
    });
    expect(m.email.subject.toLowerCase()).toContain("new listings");
  });

  it("high intent uses viewed listings copy", async () => {
    const { generateReengagementMessage } = await import("@/lib/retention/messages");
    const m = generateReengagementMessage({
      name: "Alex",
      homeCity: null,
      daysInactive: 10,
      highIntent: true,
    });
    expect(m.email.subject.toLowerCase()).toContain("looked at");
  });
});

describe("prepareReengagementBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM "User" u') && sql.includes("last_active")) {
        return [{ id: "u1", email: "a@b.c" }];
      }
      if (sql.includes("COUNT(*)") && sql.includes("user_events")) {
        return [{ n: "0" }];
      }
      if (sql.includes("NULLIF(TRIM(metadata->>")) {
        return [{ city: null }];
      }
      return [];
    });
  });

  it("excludes users with no marketing consent (empty findMany)", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const { prepareReengagementBatch } = await import("@/lib/retention/engine");
    const batch = await prepareReengagementBatch();
    expect(batch).toEqual([]);
  });

  it("includes email row when marketing email opt-in and under rate cap", async () => {
    const past = new Date(Date.now() - 10 * 86_400_000);
    mockFindMany.mockResolvedValueOnce([
      {
        id: "u1",
        email: "a@b.c",
        name: "N",
        phone: null,
        homeCity: "Mtl",
        marketingEmailOptIn: true,
        marketingSmsOptIn: false,
        lastReengagementMessageAt: past,
        lastActiveAt: past,
        createdAt: past,
      },
    ]);
    const { prepareReengagementBatch } = await import("@/lib/retention/engine");
    const batch = await prepareReengagementBatch();
    expect(batch).toHaveLength(1);
    expect(batch[0]?.channel).toBe("email");
    expect(batch[0]?.subject).toBeDefined();
  });

  it("rate limit excludes user contacted within 3 days", async () => {
    const recent = new Date();
    mockFindMany.mockResolvedValueOnce([
      {
        id: "u1",
        email: "a@b.c",
        name: "N",
        phone: "+1",
        homeCity: null,
        marketingEmailOptIn: true,
        marketingSmsOptIn: false,
        lastReengagementMessageAt: recent,
        lastActiveAt: new Date(Date.now() - 10 * 86_400_000),
        createdAt: new Date(0),
      },
    ]);
    const { prepareReengagementBatch } = await import("@/lib/retention/engine");
    const batch = await prepareReengagementBatch();
    expect(batch).toHaveLength(0);
  });
});

describe("sendReengagementToUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue({});
    mockLogCreate.mockResolvedValue({});
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM "User" u') && sql.includes("last_active")) {
        return [{ id: "u1", email: "a@b.c" }];
      }
      if (sql.includes("COUNT(*)") && sql.includes("user_events")) {
        return [{ n: "0" }];
      }
      if (sql.includes("NULLIF(TRIM(metadata->>")) {
        return [{ city: null }];
      }
      return [];
    });
    const past = new Date(Date.now() - 10 * 86_400_000);
    mockFindMany.mockResolvedValue([
      {
        id: "u1",
        email: "a@b.c",
        name: "N",
        phone: null,
        homeCity: "X",
        marketingEmailOptIn: true,
        marketingSmsOptIn: false,
        lastReengagementMessageAt: past,
        lastActiveAt: past,
        createdAt: past,
      },
    ]);
  });

  it("stubs email send, updates lastReengagementMessageAt, logs, tracks", async () => {
    const { sendReengagementToUsers } = await import("@/lib/retention/engine");
    const { results } = await sendReengagementToUsers(["u1"], { adminUserId: "admin1" });
    expect(results[0]?.status).toBe("sent");
    expect(sendEmail).toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockLogCreate).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      "reengagement_sent",
      expect.objectContaining({ userId: "u1" }),
      expect.objectContaining({ userId: "admin1" })
    );
  });

  it("skips user not in current batch (duplicate / opted out / rate limit)", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const { sendReengagementToUsers } = await import("@/lib/retention/engine");
    const { results } = await sendReengagementToUsers(["u1"]);
    expect(results[0]?.status).toBe("skipped");
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
