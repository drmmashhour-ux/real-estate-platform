import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const createMock = vi.fn();
const activityCreateMock = vi.fn();
const notifyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    formSubmission: { create: (...args: unknown[]) => createMock(...args) },
    formActivity: { create: (...args: unknown[]) => activityCreateMock(...args) },
  },
}));

vi.mock("@/lib/email/notifications", () => ({
  sendFormSubmissionNotificationToAdmin: (...args: unknown[]) => notifyMock(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9 })),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

describe("POST /api/growth/early-leads", () => {
  beforeEach(() => {
    createMock.mockReset();
    activityCreateMock.mockReset();
    notifyMock.mockReset();
    createMock.mockResolvedValue({
      id: "sub-1",
      clientName: "Test User",
      clientEmail: "t@example.com",
    });
    activityCreateMock.mockResolvedValue({ id: "act-1" });
    notifyMock.mockResolvedValue(undefined);
  });

  it("returns 400 when email and phone are both missing", async () => {
    const req = new Request("http://localhost/api/growth/early-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A",
        propertyLinkOrAddress: "https://example.com/l",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates FormSubmission when email provided", async () => {
    const req = new Request("http://localhost/api/growth/early-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane",
        email: "jane@example.com",
        propertyLinkOrAddress: "123 Main St",
        notes: "Need tenants",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalled();
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
    expect(notifyMock).toHaveBeenCalled();
  });
});
