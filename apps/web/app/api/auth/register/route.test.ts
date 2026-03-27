import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    mortgageExpert: { create: vi.fn().mockResolvedValue({ id: "expert-1" }) },
    referralEvent: { create: vi.fn() },
    trafficEvent: { create: vi.fn().mockResolvedValue({ id: "te-1" }) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ next_value: 1 }]),
        user: {
          create: vi.fn().mockImplementation((args: { data?: { role?: string } }) => {
            const role = args?.data?.role ?? "USER";
            return Promise.resolve({
              id: "user-1",
              email: "u@example.com",
              role,
            });
          }),
        },
        mortgageExpert: { create: vi.fn().mockResolvedValue({ id: "expert-1" }) },
        expertSubscription: { create: vi.fn().mockResolvedValue({ id: "sub-1" }) },
      };
      return cb(tx as never);
    }),
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));

vi.mock("@/lib/auth/session", () => ({
  setGuestIdCookie: vi.fn().mockReturnValue({ name: "g", value: "v", path: "/", maxAge: 1, httpOnly: true, secure: false, sameSite: "lax" }),
}));

vi.mock("@/lib/referrals", () => ({
  createReferralIfNeeded: vi.fn().mockResolvedValue(undefined),
  ensureReferralCode: vi.fn().mockResolvedValue("REFCODE"),
}));

vi.mock("@/lib/email/send", () => ({
  sendAccountVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendSignupEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/bnhub/revenue-automation", () => ({
  runBnhubPostSignupAutomation: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";

function nextRequest(url: string, body: Record<string, unknown>) {
  const req = new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as NextRequest;
  (req as { nextUrl: URL }).nextUrl = new URL(url);
  return req;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "u@example.com",
      passwordHash: "hashed",
      name: "User",
      role: "USER",
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
  });

  it("returns 400 when email is missing or invalid", async () => {
    const req = nextRequest("http://x/api/auth/register", { password: "password123", acceptLegal: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 when legal acceptance is missing", async () => {
    const req = nextRequest("http://x/api/auth/register", { email: "newuser@example.com", password: "password123" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Terms|agree/i);
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const req = nextRequest("http://x/api/auth/register", { email: "u@example.com", password: "short", acceptLegal: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/8/);
  });

  it("returns 400 when password and confirmPassword do not match", async () => {
    const req = nextRequest("http://x/api/auth/register", {
      email: "new@example.com",
      password: "password123",
      confirmPassword: "password456",
      acceptLegal: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/do not match/i);
  });

  it("returns 409 when email is already registered", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);
    const req = nextRequest("http://x/api/auth/register", {
      email: "existing@example.com",
      password: "password123",
      confirmPassword: "password123",
      acceptLegal: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/already/i);
  });

  it("returns 200 with needsEmailVerification when USER registration succeeds", async () => {
    const req = nextRequest("http://x/api/auth/register", {
      email: "new@example.com",
      password: "password123",
      confirmPassword: "password123",
      acceptLegal: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.needsEmailVerification).toBe(true);
    expect(data.userId).toBe("user-1");
    expect(data.email).toBe("u@example.com");
  });
});
