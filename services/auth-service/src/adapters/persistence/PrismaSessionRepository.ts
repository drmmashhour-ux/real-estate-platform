import { PrismaClient } from "../../generated/prisma/index.js";
import type { SessionEntity } from "../../domain/entities/Session.js";
import type { ISessionRepository } from "../../domain/ports/SessionRepository.js";

export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<SessionEntity> {
    const row = await this.prisma.userSession.create({
      data: { userId, tokenHash, expiresAt },
    });
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async findByTokenHash(tokenHash: string): Promise<SessionEntity | null> {
    const row = await this.prisma.userSession.findFirst({
      where: { tokenHash },
    });
    return row
      ? {
          id: row.id,
          userId: row.userId,
          tokenHash: row.tokenHash,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
        }
      : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { tokenHash } });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { userId } });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
