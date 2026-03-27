import { describe, it, expect, vi } from "vitest";
import { Login } from "./Login.js";
import type { UserEntity } from "../domain/entities/User.js";
import { Role } from "../domain/enums/Role.js";

const activeUser: UserEntity = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: "bcryptHash",
  name: "User",
  phone: null,
  locale: "en_CA",
  timezone: null,
  verificationStatus: "PENDING",
  suspendedAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [Role.GUEST],
};

describe("Login", () => {
  it("throws INVALID_CREDENTIALS when user not found", async () => {
    const userRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      findById: vi.fn(),
      updateLastLoginAt: vi.fn(),
    };
    const login = new Login(
      userRepo as any,
      { verify: vi.fn() } as any,
      {} as any,
      {} as any,
      900,
      604800
    );
    await expect(login.execute({ email: "nope@example.com", password: "x" })).rejects.toThrow(
      "INVALID_CREDENTIALS"
    );
  });

  it("throws INVALID_CREDENTIALS when password wrong", async () => {
    const userRepo = {
      findByEmail: vi.fn().mockResolvedValue(activeUser),
      create: vi.fn(),
      findById: vi.fn(),
      updateLastLoginAt: vi.fn(),
    };
    const passwordHasher = { verify: vi.fn().mockResolvedValue(false) };
    const login = new Login(
      userRepo as any,
      passwordHasher as any,
      {} as any,
      {} as any,
      900,
      604800
    );
    await expect(
      login.execute({ email: "user@example.com", password: "wrong" })
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("returns tokens when credentials are valid", async () => {
    const userRepo = {
      findByEmail: vi.fn().mockResolvedValue(activeUser),
      create: vi.fn(),
      findById: vi.fn(),
      updateLastLoginAt: vi.fn().mockResolvedValue(undefined),
    };
    const passwordHasher = { verify: vi.fn().mockResolvedValue(true) };
    const tokenService = {
      signAccess: vi.fn().mockReturnValue("at"),
      signRefresh: vi.fn().mockReturnValue("rt"),
      verifyAccess: vi.fn(),
      verifyRefresh: vi.fn(),
    };
    const sessionRepo = {
      create: vi.fn().mockResolvedValue({}),
      findByTokenHash: vi.fn(),
      deleteByTokenHash: vi.fn(),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
    };

    const login = new Login(
      userRepo as any,
      passwordHasher as any,
      tokenService as any,
      sessionRepo as any,
      900,
      604800
    );

    const result = await login.execute({
      email: "user@example.com",
      password: "correct",
    });

    expect(result.user.email).toBe("user@example.com");
    expect(result.accessToken).toBe("at");
    expect(result.refreshToken).toBe("rt");
    expect(userRepo.updateLastLoginAt).toHaveBeenCalledWith("user-1", expect.any(Date));
  });
});
