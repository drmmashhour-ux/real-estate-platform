import { describe, it, expect, vi } from "vitest";
import { RegisterUser } from "./RegisterUser.js";
import type { UserEntity } from "../domain/entities/User.js";
import { Role } from "../domain/enums/Role.js";

const mockUser: UserEntity = {
  id: "user-1",
  email: "test@example.com",
  passwordHash: "hashed",
  name: "Test User",
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

describe("RegisterUser", () => {
  it("throws EMAIL_ALREADY_EXISTS when email exists", async () => {
    const userRepo = {
      create: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn(),
      updateLastLoginAt: vi.fn(),
    };
    const passwordHasher = { hash: vi.fn().mockResolvedValue("hash"), verify: vi.fn() };
    const tokenService = {
      signAccess: vi.fn().mockReturnValue("access"),
      signRefresh: vi.fn().mockReturnValue("refresh"),
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

    const useCase = new RegisterUser(
      userRepo as any,
      passwordHasher as any,
      tokenService as any,
      sessionRepo as any,
      900,
      604800
    );

    await expect(
      useCase.execute({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow("EMAIL_ALREADY_EXISTS");

    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it("creates user and returns tokens when email is new", async () => {
    const userRepo = {
      create: vi.fn().mockImplementation(async (data: { email: string; name?: string | null }) => ({
        ...mockUser,
        email: data.email,
        name: data.name ?? mockUser.name,
      })),
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      updateLastLoginAt: vi.fn(),
    };
    const passwordHasher = { hash: vi.fn().mockResolvedValue("hashed"), verify: vi.fn() };
    const tokenService = {
      signAccess: vi.fn().mockReturnValue("accessToken"),
      signRefresh: vi.fn().mockReturnValue("refreshToken"),
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

    const useCase = new RegisterUser(
      userRepo as any,
      passwordHasher as any,
      tokenService as any,
      sessionRepo as any,
      900,
      604800
    );

    const result = await useCase.execute({
      email: "new@example.com",
      password: "password123",
      name: "New User",
    });

    expect(result.user.email).toBe("new@example.com");
    expect(result.user.name).toBe("New User");
    expect(result.user.roles).toEqual([Role.GUEST]);
    expect(result.accessToken).toBe("accessToken");
    expect(result.refreshToken).toBe("refreshToken");
    expect(result.expiresIn).toBe(900);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        passwordHash: "hashed",
        name: "New User",
        roles: [Role.GUEST],
      })
    );
    expect(sessionRepo.create).toHaveBeenCalled();
  });
});
