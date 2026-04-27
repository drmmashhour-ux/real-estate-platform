import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockQueryRaw = vi.fn();
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({ $queryRaw: mockQueryRaw }),
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

describe("GET /api/db-test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when DB query succeeds", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const j = (await res.json()) as { status: string };
    expect(j.status).toBe("ok");
  });

  it("returns 503 when DB query fails", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
    const j = (await res.json()) as { status: string };
    expect(j.status).toBe("error");
  });
});
