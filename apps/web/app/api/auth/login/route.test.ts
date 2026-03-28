import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    mortgageExpert: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/apply-login-session", () => ({
  applyLoginSessionCookies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/referrals", () => ({
  ensureReferralCode: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "u@example.com",
      passwordHash: "hash",
      name: "User",
      role: "USER",
      emailVerifiedAt: new Date(),
      userCode: "USR-TEST01",
      twoFactorEmailEnabled: false,
    } as never);
    vi.mocked(prisma.mortgageExpert.findUnique).mockResolvedValue(null as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
  });

  it("returns 400 when email or password is missing", async () => {
    const req = new Request("http://x/api/auth/login", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 401 when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const req = new Request("http://x/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "none@example.com", password: "pass" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid/i);
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);
    const req = new Request("http://x/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "u@example.com", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid/i);
  });

  it("returns expertTermsAccepted for mortgage expert", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "exp-1",
      email: "m@example.com",
      passwordHash: "hash",
      name: "Expert",
      role: "MORTGAGE_EXPERT",
      emailVerifiedAt: new Date(),
      userCode: "USR-TEST02",
      twoFactorEmailEnabled: false,
    } as never);
    vi.mocked(prisma.mortgageExpert.findUnique).mockResolvedValue({ acceptedTerms: false } as never);
    const req = new Request("http://x/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "m@example.com", password: "correct" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.expertTermsAccepted).toBe(false);
  });

  it("returns 200 and ok when login succeeds", async () => {
    const req = new Request("http://x/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "u@example.com", password: "correct" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.userId).toBe("user-1");
    expect(data.email).toBe("u@example.com");
    expect(data.role).toBe("USER");
  });
});
