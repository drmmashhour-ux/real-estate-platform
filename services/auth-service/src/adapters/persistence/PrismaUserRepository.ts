import { PrismaClient } from "@prisma/client";
import type { UserEntity } from "../../domain/entities/User.js";
import type { IUserRepository, CreateUserInput } from "../../domain/ports/UserRepository.js";
import type { Role } from "../../domain/enums/Role.js";
import { AuthRole } from "@prisma/client";

const roleMap = {
  GUEST: "GUEST",
  HOST: "HOST",
  BROKER: "BROKER",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  SUPPORT: "SUPPORT",
} as const;

function toDomainRole(r: AuthRole): keyof typeof roleMap {
  return r as keyof typeof roleMap;
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserInput): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? undefined,
        phone: data.phone ?? undefined,
        locale: data.locale ?? undefined,
        roles: {
          create: (data.roles ?? ["GUEST"]).map((r) => ({ role: r as AuthRole })),
        },
      },
      include: { roles: true },
    });
    return this.toEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { roles: true },
    });
    return user ? this.toEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: true },
    });
    return user ? this.toEntity(user) : null;
  }

  async updateLastLoginAt(userId: string, at: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: at },
    });
  }

  private toEntity(row: {
    id: string;
    email: string;
    passwordHash: string | null;
    name: string | null;
    phone: string | null;
    locale: string | null;
    timezone: string | null;
    verificationStatus: string;
    suspendedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    roles: { role: AuthRole }[];
  }): UserEntity {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      phone: row.phone,
      locale: row.locale,
      timezone: row.timezone,
      verificationStatus: row.verificationStatus as UserEntity["verificationStatus"],
      suspendedAt: row.suspendedAt,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      roles: row.roles.map((r) => toDomainRole(r.role)) as Role[],
    };
  }
}
